const { createGitHubUtils } = require('./github-utils');

const REPO = { owner: 'rainbow-me', repo: 'rainbow' };

const makeContext = () => ({
  repo: REPO,
  payload: { repository: { full_name: 'rainbow-me/rainbow' } },
});

const makeCore = () => ({
  info: jest.fn(),
  warning: jest.fn(),
  setFailed: jest.fn(),
});

const makeGithub = () => ({
  rest: {
    git: {
      updateRef: jest.fn(),
      createRef: jest.fn(),
      deleteRef: jest.fn(),
    },
  },
});

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

describe('createOrUpdateBranch', () => {
  it('updates the ref when it exists', async () => {
    const github = makeGithub();
    const core = makeCore();
    const utils = createGitHubUtils({ github, context: makeContext(), core });
    github.rest.git.updateRef.mockResolvedValue();

    await utils.createOrUpdateBranch('ci/external-pr/42', 'abc');

    expect(github.rest.git.updateRef).toHaveBeenCalledWith({
      ...REPO,
      ref: 'heads/ci/external-pr/42',
      sha: 'abc',
      force: true,
    });
    expect(github.rest.git.createRef).not.toHaveBeenCalled();
  });

  it('falls back to createRef when updateRef returns 422 (ref does not exist)', async () => {
    const github = makeGithub();
    const core = makeCore();
    const utils = createGitHubUtils({ github, context: makeContext(), core });
    github.rest.git.updateRef.mockRejectedValue(new HttpError(422, 'Reference does not exist'));
    github.rest.git.createRef.mockResolvedValue();

    await utils.createOrUpdateBranch('ci/external-pr/42', 'abc');

    expect(github.rest.git.createRef).toHaveBeenCalledWith({
      ...REPO,
      ref: 'refs/heads/ci/external-pr/42',
      sha: 'abc',
    });
  });

  it('re-throws on 403 (branch protection / permissions)', async () => {
    const github = makeGithub();
    const core = makeCore();
    const utils = createGitHubUtils({ github, context: makeContext(), core });
    github.rest.git.updateRef.mockRejectedValue(new HttpError(403, 'Resource not accessible by integration'));

    await expect(utils.createOrUpdateBranch('ci/external-pr/42', 'abc')).rejects.toThrow('Resource not accessible by integration');
    expect(github.rest.git.createRef).not.toHaveBeenCalled();
  });

  it('re-throws on 5xx transient failures', async () => {
    const github = makeGithub();
    const core = makeCore();
    const utils = createGitHubUtils({ github, context: makeContext(), core });
    github.rest.git.updateRef.mockRejectedValue(new HttpError(500, 'Server Error'));

    await expect(utils.createOrUpdateBranch('ci/external-pr/42', 'abc')).rejects.toThrow('Server Error');
    expect(github.rest.git.createRef).not.toHaveBeenCalled();
  });
});

describe('deleteBranch', () => {
  it('returns true and logs when delete succeeds', async () => {
    const github = makeGithub();
    const core = makeCore();
    const utils = createGitHubUtils({ github, context: makeContext(), core });
    github.rest.git.deleteRef.mockResolvedValue();

    const result = await utils.deleteBranch('ci/external-pr/42');

    expect(result).toBe(true);
    expect(core.info).toHaveBeenCalledWith('Deleted branch ci/external-pr/42');
  });

  it('returns false on 422 (already absent — idempotent)', async () => {
    const github = makeGithub();
    const core = makeCore();
    const utils = createGitHubUtils({ github, context: makeContext(), core });
    github.rest.git.deleteRef.mockRejectedValue(new HttpError(422, 'Reference does not exist'));

    const result = await utils.deleteBranch('ci/external-pr/42');

    expect(result).toBe(false);
    expect(core.warning).not.toHaveBeenCalled();
  });

  it('warns and rethrows on 403', async () => {
    const github = makeGithub();
    const core = makeCore();
    const utils = createGitHubUtils({ github, context: makeContext(), core });
    github.rest.git.deleteRef.mockRejectedValue(new HttpError(403, 'forbidden'));

    await expect(utils.deleteBranch('ci/external-pr/42')).rejects.toThrow('forbidden');
    expect(core.warning).toHaveBeenCalledWith(expect.stringContaining('Failed to delete branch ci/external-pr/42'));
    expect(core.warning).toHaveBeenCalledWith(expect.stringContaining('forbidden'));
  });

  it('warns and rethrows on 5xx', async () => {
    const github = makeGithub();
    const core = makeCore();
    const utils = createGitHubUtils({ github, context: makeContext(), core });
    github.rest.git.deleteRef.mockRejectedValue(new HttpError(500, 'Server Error'));

    await expect(utils.deleteBranch('ci/external-pr/42')).rejects.toThrow('Server Error');
    expect(core.warning).toHaveBeenCalled();
  });
});
