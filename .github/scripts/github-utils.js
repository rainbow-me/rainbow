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
      } catch {
        await github.rest.git.createRef({ ...repo, ref: `refs/heads/${branch}`, sha });
      }
    },

    async deleteBranch(branch) {
      try {
        await github.rest.git.deleteRef({ ...repo, ref: `heads/${branch}` });
        core.info(`Deleted branch ${branch}`);
        return true;
      } catch {
        return false;
      }
    },

    async createCheckRun({ name, headSha, status, conclusion, detailsUrl, title, summary }) {
      await github.rest.checks.create({
        ...repo,
        name,
        head_sha: headSha,
        status,
        ...(conclusion && { conclusion }),
        ...(detailsUrl && { details_url: detailsUrl }),
        output: { title, summary },
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
