const { createGitHubUtils } = require('./github-utils');

const REQUIRED_APPROVALS = 2;
const AUTHORIZED_LOGINS = new Set(['olerass', 'jinchung', 'christianbaroni']);
const AUTHORIZED_MENTIONS = [...AUTHORIZED_LOGINS].map(login => `@${login}`).join(', ');
const BRANCH_PREFIX = 'ci/external-pr';

async function postGuide({ github, context, core }) {
  const utils = createGitHubUtils({ github, context, core });
  const headSha = context.payload.pull_request.head.sha;

  await utils.createComment(
    context.payload.pull_request.number,
    [
      '**External PR: CI Authorization Required**',
      '',
      "CI checks don't run automatically on pull requests from forks (secrets are unavailable for security reasons).",
      '',
      `To trigger CI, ${REQUIRED_APPROVALS} of the authorized maintainers (${AUTHORIZED_MENTIONS}) must each comment \`${authorizeCommand.format('<sha>')}\` after reviewing the code, where \`<sha>\` is the latest commit on this PR at the time of review, e.g.:`,
      '',
      '```',
      authorizeCommand.format(headSha),
      '```',
      '',
      'If new commits are pushed, previous approvals no longer apply (the SHA changes).',
    ].join('\n')
  );
}

async function resetOnPush({ github, context, core }) {
  const utils = createGitHubUtils({ github, context, core });
  const prNumber = context.payload.pull_request.number;
  const newSha = context.payload.pull_request.head.sha;
  const priorSha = context.payload.before;

  await utils.deleteBranch(externalBranch.for(prNumber));

  // Only notify if there were approvals to invalidate, otherwise every push
  // on an unauthorized PR generates a noisy "previous authorizations no
  // longer apply" comment claiming a reset that never happened.
  const priorApprovers = await getApproversForSha({ utils, prNumber, headSha: priorSha });
  if (priorApprovers.size === 0) {
    return;
  }

  await utils.createComment(
    prNumber,
    `New commits pushed. Previous CI authorizations no longer apply. To re-authorize, review the changes and comment \`${authorizeCommand.format(newSha)}\`.`
  );
}

async function handleAuthorization({ github, context, core }) {
  const utils = createGitHubUtils({ github, context, core });
  const prNumber = context.payload.issue.number;
  const commenter = context.payload.comment.user.login;

  const pr = await utils.getPullRequest(prNumber);
  if (!utils.isForkPR(pr)) {
    return;
  }

  if (!AUTHORIZED_LOGINS.has(commenter)) {
    await utils.createComment(prNumber, `@${commenter} is not authorized to approve external CI. Only authorized maintainers can do this.`);
    return;
  }

  const approvedSha = authorizeCommand.parseSha(context.payload.comment.body);
  if (!approvedSha) {
    await utils.createComment(prNumber, `Invalid command. Usage: \`${authorizeCommand.format(pr.head.sha)}\``);
    return;
  }
  if (pr.head.sha !== approvedSha) {
    await utils.createComment(
      prNumber,
      `SHA \`${approvedSha}\` doesn't match the current PR head \`${pr.head.sha}\`. Please review the latest changes and use the current SHA.`
    );
    return;
  }

  const approvers = await getApproversForSha({ utils, prNumber, headSha: pr.head.sha });
  // listComments may not yet show the just-posted /authorize-ci comment due
  // to eventual consistency. Add the triggering commenter explicitly since
  // we already validated their command above.
  approvers.add(commenter);

  const approvalCount = approvers.size;
  const shortSha = approvedSha.substring(0, 7);
  if (approvalCount < REQUIRED_APPROVALS) {
    await utils.createComment(
      prNumber,
      `\`${authorizeCommand.name}\` recorded from @${commenter} for \`${shortSha}\` (${approvalCount}/${REQUIRED_APPROVALS}). One more authorized approval required.`
    );
    return;
  }

  const branch = externalBranch.for(prNumber);
  await utils.createOrUpdateBranch(branch, pr.head.sha);
  await utils.createComment(
    prNumber,
    `\`${authorizeCommand.name}\` recorded from @${commenter} for \`${shortSha}\` (${approvalCount}/${REQUIRED_APPROVALS}). CI triggered on internal branch \`${branch}\`.`
  );
}

async function cleanup({ github, context, core }) {
  const utils = createGitHubUtils({ github, context, core });
  await utils.deleteBranch(externalBranch.for(context.payload.pull_request.number));
}

async function relayStatus({ github, context, core }) {
  const utils = createGitHubUtils({ github, context, core });
  const run = context.payload.workflow_run;
  let prNumber;
  try {
    prNumber = externalBranch.parsePRNumber(run.head_branch);
  } catch (e) {
    utils.fail(e.message);
    return;
  }

  // Use the SHA the workflow actually ran on, NOT the current PR head.
  // If new commits were pushed while CI was running, pr.head.sha would
  // point to untested code. workflow_run.head_sha is the tested commit.
  const headSha = run.head_sha;
  const event = context.payload.action;

  utils.info(`Relaying ${event} for "${run.name}" to PR #${prNumber} (${headSha})`);

  // Relay per-job results so check names match the required status checks
  // on the target branch (e.g. "lint-and-unit-test", "Simulator", "Device").
  const {
    data: { jobs },
  } = await github.rest.actions.listJobsForWorkflowRun({
    ...context.repo,
    run_id: run.id,
  });

  // workflow_run fires three times per run (requested, in_progress, completed),
  // so each job would get up to 3 check runs without dedup. Use external_id
  // keyed on (run.id, job.id) to upsert: a workflow re-run gets fresh check
  // runs (new run.id), while progress updates within one run replace in place.
  const existingChecks = await utils.listChecksForRef(headSha);

  // Per-job try/catch so one transient API failure (rate-limit, 5xx) doesn't
  // skip the rest of the jobs in the run. Subsequent workflow_run events
  // heal partial coverage via the external_id upsert above.
  let failures = 0;
  for (const job of jobs) {
    try {
      const externalId = relayCheckRun.externalIdFor(run.id, job.id);
      const existing = existingChecks.find(c => c.external_id === externalId);

      const knownStatuses = ['completed', 'in_progress'];
      const status = knownStatuses.includes(job.status) ? job.status : 'queued';
      const conclusion = status === 'completed' ? job.conclusion || 'neutral' : undefined;
      const title = status === 'completed' ? capitalize(conclusion) : status === 'in_progress' ? 'Running' : 'Queued';
      const detailsUrl = job.html_url || run.html_url;
      const payload = { status, conclusion, detailsUrl, title, summary: `[View job](${detailsUrl})` };

      if (existing) {
        await utils.updateCheckRun({ checkRunId: existing.id, ...payload });
      } else {
        await utils.createCheckRun({ name: job.name, headSha, externalId, ...payload });
      }
    } catch (err) {
      failures += 1;
      utils.warn(`Failed to relay job "${job.name}" (id=${job.id}): ${err.message}`);
    }
  }

  if (failures > 0) {
    utils.fail(`Failed to relay ${failures} of ${jobs.length} jobs for workflow run ${run.id}`);
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const authorizeCommand = {
  name: '/authorize-ci',
  pattern: /^\/authorize-ci\s+([0-9a-f]{40})$/i,

  parseSha(text) {
    const match = text.trim().match(this.pattern);
    return match ? match[1] : null;
  },
  format(sha) {
    return `${this.name} ${sha}`;
  },
};

const externalBranch = {
  for(prNumber) {
    return `${BRANCH_PREFIX}/${prNumber}`;
  },
  parsePRNumber(branchName) {
    const num = parseInt(branchName.split('/').pop(), 10);
    if (isNaN(num)) {
      throw new Error(`Could not extract PR number from branch: ${branchName}`);
    }
    return num;
  },
};

const relayCheckRun = {
  externalIdFor(runId, jobId) {
    return `external-ci-relay:${runId}:${jobId}`;
  },
};

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

async function getApproversForSha({ utils, prNumber, headSha }) {
  const comments = await utils.listComments(prNumber);

  // Collect unique authorized users who approved the given SHA.
  // Each approval pins to a specific commit via `/authorize-ci <sha>`, so
  // new commits (new SHA) automatically invalidate all previous approvals.
  const approvers = new Set();
  for (const c of comments) {
    if (authorizeCommand.parseSha(c.body) !== headSha) {
      continue;
    }
    if (AUTHORIZED_LOGINS.has(c.user.login)) {
      approvers.add(c.user.login);
    }
  }
  return approvers;
}

module.exports = { postGuide, resetOnPush, handleAuthorization, cleanup, relayStatus };
