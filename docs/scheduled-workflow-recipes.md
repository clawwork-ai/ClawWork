# Scheduled Workflow Recipes

ClawWork's Cron panel can run repeatable OpenClaw tasks against the same
Gateway capabilities you use in chat. These recipes give operators a concrete
starting point for plugin-backed work that should stay visible in task history,
run history, artifacts, and approval prompts.

Use them as templates, not hidden automation. Keep secrets in Gateway or plugin
config, keep tool scopes narrow, and prefer a manual first run before enabling a
schedule.

## X/Twitter Monitor Digest With TweetClaw

Use this when you want a scheduled task that searches tweets, checks monitored
accounts, summarizes replies, or drafts a daily X/Twitter report inside
ClawWork. TweetClaw is an optional OpenClaw plugin backed by Xquik. It exposes
the free `explore` catalog tool and the optional `tweetclaw` API tool for
account-backed X/Twitter automation or read-only MPP calls.

### Install And Allow Tools

Install the plugin from the OpenClaw Gateway environment, then allow only its 2
tool names alongside your normal tool profile:

```bash
openclaw plugins install @xquik/tweetclaw
openclaw config set tools.alsoAllow '["explore", "tweetclaw"]'
openclaw plugins inspect tweetclaw --runtime
openclaw skills info tweetclaw
```

Store credentials in Gateway config, not in ClawWork messages, task names, or
cron prompts:

```bash
openclaw config set plugins.entries.tweetclaw.config.apiKey "$XQUIK_API_KEY"
```

For accountless read-only usage, configure an MPP signing key instead:

```bash
openclaw config set plugins.entries.tweetclaw.config.tempoSigningKey "$MPP_SIGNING_KEY"
```

MPP mode is read-only. It cannot post tweets, post tweet replies, create
monitors, send direct messages, upload media, create webhooks, run giveaway
draws, or read account-backed private data.

### Create The Cron Task

In ClawWork:

1. Open **Cron** from the sidebar.
2. Create a job with an `every` or `cron` schedule.
3. Use the task session target for clean recurring history.
4. Put the task instructions in the agent message.
5. Run once manually and inspect the tool calls before enabling the schedule.

Example agent message:

```text
Use TweetClaw to search tweets and tweet replies about "openclaw agents" from
the last day. Return the top source tweets, notable reply threads, repeated
questions, and links worth reviewing. Do not post, reply, follow, DM, create
monitors, upload media, or create webhooks. Ask before any write action or paid
bulk extraction.
```

For a monitored-account digest:

```text
Use TweetClaw to check recent public tweets and replies from the approved
account list in this task. Summarize new product feedback, bug reports, and
integration requests. Include tweet URLs and a short action list. Do not create
or modify monitors unless I explicitly approve the target, event types, stop
condition, and delivery destination.
```

### Operator Checks

- Start with `explore` so the agent selects the right endpoint before calling
  `tweetclaw`.
- Keep recurring prompts read-only unless the workflow explicitly needs writes.
- Review OpenClaw approval prompts before post tweets, post tweet replies,
  direct messages, follows, monitor changes, webhooks, media upload, media
  download, or giveaway draws.
- Use ClawWork run history to confirm each scheduled run produced a useful
  summary, not just raw API output.
- Disable or pause the job when the keyword, account list, or campaign window is
  no longer current.

Links:

- [TweetClaw GitHub repo](https://github.com/Xquik-dev/tweetclaw)
- [TweetClaw npm package](https://www.npmjs.com/package/@xquik/tweetclaw)
- [TweetClaw ClawHub listing](https://clawhub.ai/plugins/@xquik/tweetclaw)
