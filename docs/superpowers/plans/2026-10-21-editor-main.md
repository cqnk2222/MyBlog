# Editor main publishing plan

Goal: publish the entire committed codex branch to origin/main from the local editor.
Architecture: save and commit content using the existing publisher, then merge a pinned branch head into freshly fetched main in a temporary clone. Push without force. Never switch the working checkout. Dirty code is explicitly excluded.

- [x] Add real local Git repository tests for full-branch merge, conflict rejection, dirty-checkout preservation, and non-codex branch rejection.
- [x] Implement isolated merge helper with bounded Git commands, cleanup, identity forwarding, and operation serialization.
- [x] Wire POST /merge-main and a distinct editor action with confirmation, logs, and unsaved-file guard. Existing publish remains available.
- [x] Document behavior; run Git tests, existing tests, and Astro build.
