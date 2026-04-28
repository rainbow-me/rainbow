function createGitHubUtils({ github, context, core }) {
  const repo = context.repo;

  return {
    info: core.info.bind(core),
    warn: core.warning.bind(core),
    fail: core.setFailed.bind(core),

    async createComment(prNumber, body) {
      await github.rest.issues.createComment({ ...repo, issue_number: prNumber, body });
    },

    async getPullRequest(prNumber) {
      const { data: pr } = await github.rest.pulls.get({ ...repo, pull_number: prNumber });
      return pr;
    },

    async createOrUpdateBranch(branch, sha) {
      try {
        await github.rest.git.updateRef({ ...repo, ref: `heads/${branch}`, sha, force: true });
      } catch (err) {
        if (err.status !== 422) {
          throw err;
        }
        await github.rest.git.createRef({ ...repo, ref: `refs/heads/${branch}`, sha });
      }
    },

    async deleteBranch(branch) {
      try {
        await github.rest.git.deleteRef({ ...repo, ref: `heads/${branch}` });
        core.info(`Deleted branch ${branch}`);
        return true;
      } catch (err) {
        if (err.status === 422) {
          return false;
        }
        core.warning(`Failed to delete branch ${branch}: ${err.message}`);
        throw err;
      }
    },

    async createCheckRun({ name, headSha, externalId, status, conclusion, detailsUrl, title, summary }) {
      await github.rest.checks.create({
        ...repo,
        name,
        head_sha: headSha,
        ...(externalId && { external_id: externalId }),
        status,
        ...(conclusion && { conclusion }),
        ...(detailsUrl && { details_url: detailsUrl }),
        output: { title, summary },
      });
    },

    async updateCheckRun({ checkRunId, status, conclusion, detailsUrl, title, summary }) {
      await github.rest.checks.update({
        ...repo,
        check_run_id: checkRunId,
        status,
        ...(conclusion && { conclusion }),
        ...(detailsUrl && { details_url: detailsUrl }),
        output: { title, summary },
      });
    },

    async listChecksForRef(headSha) {
      return github.paginate(github.rest.checks.listForRef, {
        ...repo,
        ref: headSha,
        filter: 'all',
        per_page: 100,
      });
    },

    async listComments(prNumber) {
      return github.paginate(github.rest.issues.listComments, {
        ...repo,
        issue_number: prNumber,
      });
    },

    isForkPR(pr) {
      return pr.head.repo?.full_name !== context.payload.repository.full_name;
    },
  };
}

module.exports = { createGitHubUtils };
