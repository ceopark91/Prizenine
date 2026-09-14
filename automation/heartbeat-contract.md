# PrizeNine heartbeat execution order

The Codex heartbeat is chat-bound because Computer Use and Topview MCP
authentication are chat-bound. Recreate the same order after cloning this
repository on another PC:

1. Run the live Supabase queue selector and read `next.requiredAction`.
2. If the action is `PREPARE_TOPVIEW_MEDIA` or `SUBMIT_TOPVIEW_TASK`, execute
   it in the current authenticated Codex chat with Topview MCP. Do not launch a
   detached worker for that stage.
3. Re-read the job after every mutation. Persist Topview task receipts before
   changing the stage.
4. For all other actions, let the Luna Light worker advance one verified stage
   only, then re-run the queue selector.
5. A non-terminal job can only be quiet when its current provider task is
   genuinely running. A missing task receipt, missing media binding, or failed
   quality gate is actionable and must be repaired.

The heartbeat announces only completion, an actual provider failure, or a
required user action. It does not announce unchanged queues.
