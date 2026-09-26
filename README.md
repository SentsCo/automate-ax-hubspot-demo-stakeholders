# Create role-based follow-up tasks after a HubSpot demo

A deal with several contacts calls for different follow-up work than one generic sequence sent to everybody.

When a HubSpot deal moves into your demo-complete stage, this example reads every contact associated with the deal. It compares a contact role property with the primary role value you choose. A match produces a call task; every other associated contact gets a recap-review task. Tasks go to the deal owner, or to a fallback owner if the deal has none.

Each task is attached to its contact and includes the deal ID and contact email. Slack reports how many tasks were created. The owner reviews the demo notes, confirms who actually attended, and decides what to say before contacting anyone. The automation does not send emails or infer attendance from a deal association.

## Set it up with a coding agent

Copy the setup prompt from [the article](https://automate.ax/articles/hubspot-demo-stakeholders) into your coding agent. The agent creates the Automate.ax project, asks for your choices, guides account authorization, checks the automation, and deploys it. You do not need to clone this repository yourself when using the prompt.

You'll choose:

- The HubSpot deal stage ID that means a demo has finished.
- The HubSpot contact property and value that mark a primary contact.
- A fallback HubSpot owner for deals without an assigned owner.
- The HubSpot task-to-contact association type ID and Slack channel for the task count.
- Account authorization.

## Manual setup

If you prefer to set it up yourself:

```sh
git clone https://github.com/SentsCo/automate-ax-hubspot-demo-stakeholders.git
cd automate-ax-hubspot-demo-stakeholders
bun install
bunx automate.ax login
bunx automate.ax init
bun run typecheck
bunx automate.ax deploy
```

Connect the accounts requested by Automate.ax when you deploy. The platform stores credentials outside this repository. Set any project parameters requested by the automation, then review the read and write operations before turning it on.

## Check a run

Use a test deal with one contact whose role matches the primary value and one whose role does not. Confirm each gets the correct task type and contact association, the deal owner receives both, and Slack reports two tasks. Re-entering the stage can create another set of tasks.

## Limits

- Every associated contact gets a task, even if they did not attend the demo. The owner checks attendance and the meeting notes before reaching out.
- Any contact whose role does not match the primary value gets a recap-review task. If the role data is missing or ambiguous, the automation does not stop to resolve it.
- Moving a deal into the demo-complete stage again can create another set of tasks. Add a deduplication rule if deals often re-enter that stage.

The workflow responds to [a real problem described by A B2B team's post-demo follow-up question on Reddit](https://www.reddit.com/r/hubspot/comments/1n6nhwp/how_do_you_handle_followup_on_deals_with_multiple/). The public report informed the example; it is not an endorsement of this implementation.
