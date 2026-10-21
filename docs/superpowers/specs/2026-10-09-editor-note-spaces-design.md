# Editor note categories

The editor must follow the four categories already shown on Notes: Course Notes,
PreTraining, PostTraining, and AI Infra. Notes navigation groups existing files by
category while retaining their real directory structure and folder creation buttons.
All four categories remain visible, including empty PostTraining. Other collections
retain their directory navigation.

Both new notes and the metadata form provide a category selector. A new optional
`space` frontmatter field persists an explicit choice without moving files. Existing
notes infer their category from the established series and path mappings, and an
unchanged inferred category does not introduce a field during save. Explicit category
choices take precedence over legacy mappings.

One shared data module owns category definitions and membership rules, consumed by
the website and editor API. Unknown manual notes remain accessible as Unclassified.

Verify legacy classification, explicit assignment and reassignment, invalid category
rejection, empty category navigation, and creation in every category using temporary
content fixtures. Build the website and exercise the editor in a browser. Do not
commit, publish, or change existing Markdown content as part of this UI update.
