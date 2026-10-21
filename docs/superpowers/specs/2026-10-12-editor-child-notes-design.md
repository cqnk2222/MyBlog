# Editor child notes

Add a note-level `+` and a `新建子笔记 / 章节` action for an opened note. These
actions open the existing creation dialog with a child directory derived from the
parent filename, inherited category/series/section, and the next child order.
The dialog shows the parent title and editable series/order. Original parent
content and URLs remain intact. An `index.md` overview creates children alongside
the overview in its existing directory. Nested child notes can have their own children.

In the editor tree, a note with a matching filename-stem directory becomes an
expandable parent: its title still opens the original note, its arrow expands the
children, and its `+` adds another child. Regular folder and root creation remain
available. The API's existing directory creation and duplicate-file protection are reused.

Unsaved drafts retain the existing switch confirmation. Child defaults may use the
opened parent's current metadata, but creating a child does not rewrite its parent.
Verify inheritance, numbering, nested creation, hierarchy/selection, collisions,
regular creation, draft preservation, development compilation, and production build.
