# Versioning the prototype

## Repository

- GitHub: https://github.com/jrosenberg4799/juggle
- Local checkout in this Codex cloud workspace: `/workspace/juggle`
- Main branch: `main`
- First prototype baseline: annotated tag `v1.0.0`
- Operator workflow baseline: annotated tag `v2.0.0` (see Version 2 guide)

The cloud checkout is not a folder on the owner's personal computer. To create a laptop checkout, clone the GitHub repository into the desired local directory. The GitHub repository is the durable shared source of truth.

## Included in version control

Application source, dependency lockfile, active SQL migrations, architecture drafts, the README, build status, changelog and a Markdown snapshot of the client workflow guide.

Supabase live records, uploaded media, passwords, session tokens and local environment files are not Git backups and must not be committed. The editable Google Doc does not automatically synchronize; copy agreed revisions to `docs/CLIENT-WORKFLOW.md` when they become project requirements.

## Working on the next change

```sh
git switch main
git pull --ff-only
git switch -c feature/describe-the-change
# Make a focused change and run the appropriate checks.
git add <changed-files>
git commit -m "Describe the resulting behavior"
git push -u origin feature/describe-the-change
```

Review and merge a feature branch before preparing the next milestone. Create new annotated tags for future baselines; never move or overwrite an existing milestone tag. View Version 1 safely with `git show v1.0.0` or in a separate checkout/worktree rather than resetting active work.

## Deployment

The current live prototype is https://juggle-mocha.vercel.app. Vercel currently uses direct source deployments; GitHub automatic deployment is not connected. A push or tag saves source but does not itself deploy it. The v1.0.0 baseline preserves the first prototype. The v2.0.0 baseline updates the operator interfaces and workflow; see the Version 2 guide.
