const mockUtils = {
  createComment: jest.fn(),
  getPullRequest: jest.fn(),
  listComments: jest.fn(),
  deleteBranch: jest.fn(),
  createOrUpdateBranch: jest.fn(),
  createCheckRun: jest.fn(),
  updateCheckRun: jest.fn(),
  listChecksForRef: jest.fn(),
  isForkPR: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  fail: jest.fn(),
};

jest.mock('./github-utils', () => ({
  createGitHubUtils: () => mockUtils,
}));

const { handleAuthorization, relayStatus, resetOnPush } = require('./external-ci');

beforeEach(() => {
  jest.resetAllMocks();
  mockUtils.listChecksForRef.mockResolvedValue([]);
});

describe('handleAuthorization', () => {
  const github = {};
  const core = {};
  const HEAD_SHA = 'abc1234def5678abc1234def5678abc1234def56';
  const OTHER_SHA = '0000000000000000000000000000000000000000';
  const AUTHORIZE = `/authorize-ci ${HEAD_SHA}`;

  const setupAuthorizationComment = ({ commentBody, commenter = 'olerass', prNumber = 1, isFork, headSha = HEAD_SHA } = {}) => {
    mockUtils.getPullRequest.mockResolvedValue({ head: { sha: headSha } });
    mockUtils.isForkPR.mockReturnValue(isFork);
    mockUtils.listComments.mockResolvedValue([]);
    return {
      context: {
        payload: {
          issue: { number: prNumber },
          comment: { body: commentBody, user: { login: commenter } },
          repository: { full_name: 'rainbow-me/rainbow' },
        },
        repo: { owner: 'rainbow-me', repo: 'rainbow' },
      },
    };
  };

  it('posts comments to the correct PR', async () => {
    const prNumber = 99;
    const { context } = setupAuthorizationComment({
      commentBody: AUTHORIZE,
      commenter: 'olerass',
      prNumber,
      isFork: true,
    });

    await handleAuthorization({ github, context, core });

    expect(mockUtils.createComment).toHaveBeenCalledWith(prNumber, expect.any(String));
  });

  it('ignores non-fork PRs', async () => {
    const { context } = setupAuthorizationComment({ commentBody: AUTHORIZE, isFork: false });

    await handleAuthorization({ github, context, core });

    expect(mockUtils.createComment).not.toHaveBeenCalled();
  });

  it('rejects unauthorized users', async () => {
    const { context } = setupAuthorizationComment({
      commentBody: AUTHORIZE,
      commenter: 'random-user',
      isFork: true,
    });

    await handleAuthorization({ github, context, core });

    expect(mockUtils.createComment).toHaveBeenCalledWith(expect.any(Number), expect.stringContaining('not authorized'));
  });

  it('rejects invalid command format', async () => {
    const { context } = setupAuthorizationComment({ commentBody: '/authorize-ci', isFork: true });

    await handleAuthorization({ github, context, core });

    expect(mockUtils.createComment).toHaveBeenCalledWith(expect.any(Number), expect.stringContaining('Invalid command'));
  });

  it('rejects SHA that does not match PR head', async () => {
    const { context } = setupAuthorizationComment({
      commentBody: `/authorize-ci ${OTHER_SHA}`,
      isFork: true,
      headSha: 'abc1234def5678abc1234def5678abc1234def567',
    });

    await handleAuthorization({ github, context, core });

    expect(mockUtils.createComment).toHaveBeenCalledWith(expect.any(Number), expect.stringContaining("doesn't match"));
  });

  it('posts waiting status when only 1 of 2 approvals', async () => {
    const { context } = setupAuthorizationComment({ commentBody: AUTHORIZE, isFork: true });
    mockUtils.listComments.mockResolvedValue([]);

    await handleAuthorization({ github, context, core });

    expect(mockUtils.createComment).toHaveBeenCalledWith(expect.any(Number), expect.stringContaining('1/2'));
    expect(mockUtils.createOrUpdateBranch).not.toHaveBeenCalled();
  });

  it('pushes internal branch when 2 of 2 approvals met', async () => {
    const prNumber = 77;
    const { context } = setupAuthorizationComment({ commentBody: AUTHORIZE, isFork: true, prNumber });
    mockUtils.listComments.mockResolvedValue([{ user: { login: 'jinchung' }, body: AUTHORIZE, created_at: '2026-01-01T00:00:00Z' }]);

    await handleAuthorization({ github, context, core });

    expect(mockUtils.createOrUpdateBranch).toHaveBeenCalledWith(`ci/external-pr/${prNumber}`, expect.any(String));
    expect(mockUtils.createComment).toHaveBeenCalledWith(expect.any(Number), expect.stringContaining('CI triggered'));
  });

  it('counts same user approving twice as a single approval', async () => {
    const { context } = setupAuthorizationComment({ commentBody: AUTHORIZE, commenter: 'olerass', isFork: true });
    mockUtils.listComments.mockResolvedValue([
      { user: { login: 'olerass' }, body: AUTHORIZE },
      { user: { login: 'olerass' }, body: AUTHORIZE },
    ]);

    await handleAuthorization({ github, context, core });

    expect(mockUtils.createComment).toHaveBeenCalledWith(expect.any(Number), expect.stringContaining('1/2'));
    expect(mockUtils.createOrUpdateBranch).not.toHaveBeenCalled();
  });
});

describe('resetOnPush', () => {
  const github = {};
  const core = {};
  const PRIOR_SHA = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
  const NEW_SHA = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
  const PRIOR_AUTHORIZE = `/authorize-ci ${PRIOR_SHA}`;

  const setupSync = ({ prNumber = 1, before = PRIOR_SHA, after = NEW_SHA } = {}) => ({
    context: {
      payload: {
        pull_request: { number: prNumber, head: { sha: after } },
        before,
      },
      repo: { owner: 'rainbow-me', repo: 'rainbow' },
    },
  });

  it('always deletes the internal branch', async () => {
    const prNumber = 42;
    const { context } = setupSync({ prNumber });
    mockUtils.listComments.mockResolvedValue([]);

    await resetOnPush({ github, context, core });

    expect(mockUtils.deleteBranch).toHaveBeenCalledWith(`ci/external-pr/${prNumber}`);
  });

  it('does NOT post the reset comment when prior SHA had 0 approvals', async () => {
    const { context } = setupSync();
    mockUtils.listComments.mockResolvedValue([]);

    await resetOnPush({ github, context, core });

    expect(mockUtils.createComment).not.toHaveBeenCalled();
  });

  it('posts the reset comment when prior SHA had a single authorized approval', async () => {
    const prNumber = 7;
    const { context } = setupSync({ prNumber });
    mockUtils.listComments.mockResolvedValue([{ user: { login: 'olerass' }, body: PRIOR_AUTHORIZE }]);

    await resetOnPush({ github, context, core });

    expect(mockUtils.createComment).toHaveBeenCalledWith(prNumber, expect.stringContaining('Previous CI authorizations no longer apply'));
    expect(mockUtils.createComment).toHaveBeenCalledWith(prNumber, expect.stringContaining(NEW_SHA));
  });

  it('posts the reset comment when prior SHA had multiple authorized approvals', async () => {
    const { context } = setupSync();
    mockUtils.listComments.mockResolvedValue([
      { user: { login: 'olerass' }, body: PRIOR_AUTHORIZE },
      { user: { login: 'jinchung' }, body: PRIOR_AUTHORIZE },
    ]);

    await resetOnPush({ github, context, core });

    expect(mockUtils.createComment).toHaveBeenCalledWith(
      expect.any(Number),
      expect.stringContaining('Previous CI authorizations no longer apply')
    );
  });

  it('does NOT count approvals from non-authorized logins', async () => {
    const { context } = setupSync();
    mockUtils.listComments.mockResolvedValue([{ user: { login: 'random-user' }, body: PRIOR_AUTHORIZE }]);

    await resetOnPush({ github, context, core });

    expect(mockUtils.createComment).not.toHaveBeenCalled();
  });

  it('does NOT count approvals for a different SHA', async () => {
    const { context } = setupSync();
    const OTHER_SHA = 'cccccccccccccccccccccccccccccccccccccccc';
    mockUtils.listComments.mockResolvedValue([{ user: { login: 'olerass' }, body: `/authorize-ci ${OTHER_SHA}` }]);

    await resetOnPush({ github, context, core });

    expect(mockUtils.createComment).not.toHaveBeenCalled();
  });
});

describe('relayStatus', () => {
  const core = {};

  const setupWorkflowRun = ({
    headBranch = 'ci/external-pr/42',
    headSha = 'abc1234',
    runName = 'Unit tests',
    runId = 100,
    runUrl = 'https://github.com/run/100',
    action = 'completed',
    jobs = [],
  } = {}) => {
    const github = {
      rest: {
        actions: {
          listJobsForWorkflowRun: jest.fn().mockResolvedValue({ data: { jobs } }),
        },
      },
    };
    const context = {
      payload: {
        action,
        workflow_run: { head_branch: headBranch, head_sha: headSha, name: runName, id: runId, html_url: runUrl },
      },
      repo: { owner: 'rainbow-me', repo: 'rainbow' },
    };
    return { github, context };
  };

  it('fails if branch name is not a valid external PR branch', async () => {
    const { github, context } = setupWorkflowRun({ headBranch: 'main' });

    await relayStatus({ github, context, core });

    expect(mockUtils.fail).toHaveBeenCalledWith(expect.stringContaining('Could not extract PR number'));
    expect(mockUtils.createCheckRun).not.toHaveBeenCalled();
  });

  it('creates no check runs when there are no jobs', async () => {
    const { github, context } = setupWorkflowRun({ jobs: [] });

    await relayStatus({ github, context, core });

    expect(mockUtils.createCheckRun).not.toHaveBeenCalled();
  });

  it('maps unknown job status to queued', async () => {
    const { github, context } = setupWorkflowRun({
      jobs: [{ name: 'build', status: 'waiting', conclusion: null, html_url: 'https://github.com/job/5' }],
    });

    await relayStatus({ github, context, core });

    expect(mockUtils.createCheckRun).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'queued',
        conclusion: undefined,
        title: 'Queued',
      })
    );
  });

  it('creates a check run for job using the workflow_run head_sha', async () => {
    const { github, context } = setupWorkflowRun({
      headSha: 'deadbeef123',
      jobs: [{ name: 'lint-and-unit-test', status: 'completed', conclusion: 'success', html_url: 'https://github.com/job/1' }],
    });

    await relayStatus({ github, context, core });

    expect(mockUtils.createCheckRun).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'lint-and-unit-test',
        headSha: 'deadbeef123',
        status: 'completed',
        conclusion: 'success',
        title: 'Success',
      })
    );
  });

  it('maps in_progress jobs correctly', async () => {
    const { github, context } = setupWorkflowRun({
      jobs: [{ name: 'Simulator', status: 'in_progress', conclusion: null, html_url: 'https://github.com/job/2' }],
    });

    await relayStatus({ github, context, core });

    expect(mockUtils.createCheckRun).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'in_progress',
        conclusion: undefined,
        title: 'Running',
      })
    );
  });

  it('maps queued jobs correctly', async () => {
    const { github, context } = setupWorkflowRun({
      jobs: [{ name: 'Device', status: 'queued', conclusion: null, html_url: 'https://github.com/job/3' }],
    });

    await relayStatus({ github, context, core });

    expect(mockUtils.createCheckRun).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'queued',
        conclusion: undefined,
        title: 'Queued',
      })
    );
  });

  it('defaults conclusion to neutral when missing on completed jobs', async () => {
    const { github, context } = setupWorkflowRun({
      jobs: [{ name: 'lint', status: 'completed', conclusion: null, html_url: 'https://github.com/job/4' }],
    });

    await relayStatus({ github, context, core });

    expect(mockUtils.createCheckRun).toHaveBeenCalledWith(
      expect.objectContaining({
        conclusion: 'neutral',
        title: 'Neutral',
      })
    );
  });

  it('falls back to run URL when job has no html_url', async () => {
    const runUrl = 'https://github.com/run/100';
    const { github, context } = setupWorkflowRun({
      runUrl,
      jobs: [{ name: 'build', status: 'completed', conclusion: 'success', html_url: null }],
    });

    await relayStatus({ github, context, core });

    expect(mockUtils.createCheckRun).toHaveBeenCalledWith(
      expect.objectContaining({
        detailsUrl: runUrl,
        summary: `[View job](${runUrl})`,
      })
    );
  });

  it('creates check runs for multiple jobs', async () => {
    const { github, context } = setupWorkflowRun({
      jobs: [
        { name: 'lint', status: 'completed', conclusion: 'success', html_url: 'https://github.com/job/1' },
        { name: 'test', status: 'completed', conclusion: 'failure', html_url: 'https://github.com/job/2' },
        { name: 'build', status: 'in_progress', conclusion: null, html_url: 'https://github.com/job/3' },
      ],
    });

    await relayStatus({ github, context, core });

    expect(mockUtils.createCheckRun).toHaveBeenCalledTimes(3);
    expect(mockUtils.createCheckRun).toHaveBeenCalledWith(expect.objectContaining({ name: 'lint', conclusion: 'success' }));
    expect(mockUtils.createCheckRun).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'test', conclusion: 'failure', title: 'Failure' })
    );
    expect(mockUtils.createCheckRun).toHaveBeenCalledWith(expect.objectContaining({ name: 'build', title: 'Running' }));
  });

  it('creates a check run with a stable external_id keyed on (run.id, job.id)', async () => {
    const { github, context } = setupWorkflowRun({
      runId: 555,
      jobs: [{ id: 777, name: 'Simulator', status: 'in_progress', conclusion: null, html_url: 'https://github.com/job/1' }],
    });

    await relayStatus({ github, context, core });

    expect(mockUtils.createCheckRun).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Simulator', externalId: 'external-ci-relay:555:777' })
    );
  });

  it('updates an existing check run when external_id matches', async () => {
    const { github, context } = setupWorkflowRun({
      runId: 555,
      jobs: [{ id: 777, name: 'Simulator', status: 'completed', conclusion: 'success', html_url: 'https://github.com/job/1' }],
    });
    mockUtils.listChecksForRef.mockResolvedValue([{ id: 9001, external_id: 'external-ci-relay:555:777' }]);

    await relayStatus({ github, context, core });

    expect(mockUtils.updateCheckRun).toHaveBeenCalledWith(
      expect.objectContaining({ checkRunId: 9001, status: 'completed', conclusion: 'success', title: 'Success' })
    );
    expect(mockUtils.createCheckRun).not.toHaveBeenCalled();
  });

  it('creates a fresh check run when run.id changes (workflow re-run)', async () => {
    const { github, context } = setupWorkflowRun({
      runId: 999, // new run.id, different from the existing check run
      jobs: [{ id: 777, name: 'Simulator', status: 'in_progress', conclusion: null, html_url: 'https://github.com/job/1' }],
    });
    mockUtils.listChecksForRef.mockResolvedValue([
      { id: 9001, external_id: 'external-ci-relay:555:777' }, // from a prior run
    ]);

    await relayStatus({ github, context, core });

    expect(mockUtils.createCheckRun).toHaveBeenCalledWith(expect.objectContaining({ externalId: 'external-ci-relay:999:777' }));
    expect(mockUtils.updateCheckRun).not.toHaveBeenCalled();
  });

  it('ignores existing check runs without a matching external_id', async () => {
    const { github, context } = setupWorkflowRun({
      runId: 100,
      jobs: [{ id: 200, name: 'lint', status: 'completed', conclusion: 'success', html_url: 'https://github.com/job/1' }],
    });
    mockUtils.listChecksForRef.mockResolvedValue([
      { id: 9001, external_id: 'unrelated-tool:42' },
      { id: 9002, external_id: null },
      { id: 9003 },
    ]);

    await relayStatus({ github, context, core });

    expect(mockUtils.createCheckRun).toHaveBeenCalledTimes(1);
    expect(mockUtils.updateCheckRun).not.toHaveBeenCalled();
  });

  it('continues relaying remaining jobs when one create rejects', async () => {
    const { github, context } = setupWorkflowRun({
      runId: 100,
      jobs: [
        { id: 1, name: 'lint', status: 'completed', conclusion: 'success', html_url: 'https://github.com/job/1' },
        { id: 2, name: 'Simulator', status: 'completed', conclusion: 'success', html_url: 'https://github.com/job/2' },
        { id: 3, name: 'Device', status: 'completed', conclusion: 'success', html_url: 'https://github.com/job/3' },
      ],
    });
    mockUtils.createCheckRun.mockImplementation(({ name }) => {
      if (name === 'Simulator') return Promise.reject(new Error('rate limit exceeded'));
      return Promise.resolve();
    });

    await relayStatus({ github, context, core });

    expect(mockUtils.createCheckRun).toHaveBeenCalledTimes(3);
    expect(mockUtils.warn).toHaveBeenCalledWith(expect.stringContaining('Simulator'));
    expect(mockUtils.warn).toHaveBeenCalledWith(expect.stringContaining('id=2'));
    expect(mockUtils.warn).toHaveBeenCalledWith(expect.stringContaining('rate limit exceeded'));
    expect(mockUtils.fail).toHaveBeenCalledWith(expect.stringContaining('Failed to relay 1 of 3 jobs'));
  });

  it('continues relaying remaining jobs when one update rejects', async () => {
    const { github, context } = setupWorkflowRun({
      runId: 100,
      jobs: [
        { id: 1, name: 'lint', status: 'completed', conclusion: 'success', html_url: 'https://github.com/job/1' },
        { id: 2, name: 'Simulator', status: 'completed', conclusion: 'success', html_url: 'https://github.com/job/2' },
      ],
    });
    mockUtils.listChecksForRef.mockResolvedValue([
      { id: 9001, external_id: 'external-ci-relay:100:1' },
      { id: 9002, external_id: 'external-ci-relay:100:2' },
    ]);
    mockUtils.updateCheckRun.mockImplementation(({ checkRunId }) => {
      if (checkRunId === 9001) return Promise.reject(new Error('forbidden'));
      return Promise.resolve();
    });

    await relayStatus({ github, context, core });

    expect(mockUtils.updateCheckRun).toHaveBeenCalledTimes(2);
    expect(mockUtils.warn).toHaveBeenCalledTimes(1);
    expect(mockUtils.fail).toHaveBeenCalledWith(expect.stringContaining('Failed to relay 1 of 2 jobs'));
  });

  it('does not fail the workflow when every job relays successfully', async () => {
    const { github, context } = setupWorkflowRun({
      runId: 100,
      jobs: [
        { id: 1, name: 'lint', status: 'completed', conclusion: 'success', html_url: 'https://github.com/job/1' },
        { id: 2, name: 'Simulator', status: 'completed', conclusion: 'success', html_url: 'https://github.com/job/2' },
      ],
    });

    await relayStatus({ github, context, core });

    expect(mockUtils.fail).not.toHaveBeenCalled();
    expect(mockUtils.warn).not.toHaveBeenCalled();
  });
});
