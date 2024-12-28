/** @odoo-module **/

import { _t } from "@web/core/l10n/translation";
import { browser } from "@web/core/browser/browser";
import { SearchPanel } from "@web/search/search_panel/search_panel";
import { useNestedSortable } from "@web/core/utils/nested_sortable";
import { usePopover } from "@web/core/popover/popover_hook";
import { user } from "@web/core/user";
import { useBus, useService } from "@web/core/utils/hooks";
import { utils as uiUtils } from "@web/core/ui/ui_service";
import { Component, onWillStart, useState } from "@odoo/owl";
import { toggleArchive } from "@dmmsys_document_basic/views/hooks";

const VALUE_SELECTOR = [".o_search_panel_category_value", ".o_search_panel_filter_value"].join();
const FOLDER_VALUE_SELECTOR = ".o_search_panel_category_value";
const LONG_TOUCH_THRESHOLD = 400;

/**
 * This file defines the DocumentsSearchPanel component, an extension of the
 * SearchPanel to be used in the documents kanban/list views.
 */

export class DocumentsSearchPanelItemSettingsPopover extends Component {
    static template = "documents.DocumentsSearchPanelItemSettingsPopover";
    static props = [
        "close", // Function, close the popover
        "createChildEnabled", // Whether we have the option to create a new child or not
        "onCreateChild", // Function, create new child
        "onEdit", // Function, edit element
        "isShareable", // Whether we have the option to share
        "onShare", // Function, share workspace
        "isEditable",
    ];
}

export class DocumentsSearchPanel extends SearchPanel {
    static modelExtension = "DocumentsSearchPanel";
    static template = !uiUtils.isSmall() ? "documents.SearchPanel" : "web.SearchPanel";
    static subTemplates = !uiUtils.isSmall()
        ? {
              section: "web.SearchPanel.Section",
              category: "documents.SearchPanel.Category",
              filtersGroup: "documents.SearchPanel.FiltersGroup",
          }
        : {
              section: "web.SearchPanel.Section",
              category: "documents.SearchPanel.Category.Small",
              filtersGroup: "documents.SearchPanel.FiltersGroup.Small",
          };
    setup() {
        super.setup(...arguments);
        const { uploads } = useService("file_upload");
        this.documentService = useService("document.document");
        this.documentUploads = uploads;
        useState(uploads);
        this.notification = useService("notification");
        this.orm = useService("orm");
        this.action = useService("action");
        this.popover = usePopover(DocumentsSearchPanelItemSettingsPopover, {
            onClose: () => this.onPopoverClose?.(),
            popoverClass: "o_search_panel_item_settings_popover",
        });
        this.dialog = useService("dialog");

        onWillStart(async () => {
            this.isDocumentManager = await user.hasGroup("dmmsys_document_basic.group_documents_manager");
            const selectedFolderId = this.env.searchModel.getSelectedFolderId();
            if (selectedFolderId) {
                this._expandFolder({ folderId: selectedFolderId });
            }
        });

        useBus(this.env.documentsView.bus, "documents-expand-folder", (ev) => {
            this._expandFolder(ev.detail);
        });
        useBus(this.env.documentsView.bus, "documents-open-edit-selected-folder", () => {
            const selectedFolderId = this.env.searchModel.getSelectedFolderId();
            if (selectedFolderId) {
                this.editSectionValue("documents.document", selectedFolderId);
            }
        });

        useNestedSortable({
            ref: this.root,
            groups: ".o_search_panel_category",
            elements: "li:not(.o_all_or_trash_category)",
            enable: () => this.isDocumentManager,
            nest: true,
            nestInterval: 10,
            /**
             * When the placeholder moves, unfold the new parent and show/hide carets
             * where needed.
             * @param {DOMElement} parent - parent element of where the element was moved
             * @param {DOMElement} newGroup - group in which the element was moved
             * @param {DOMElement} prevPos.parent - element's parent before the move
             * @param {DOMElement} placeholder - hint element showing the current position
             */
            onMove: ({ parent, newGroup, prevPos, placeholder }) => {
                if (parent) {
                    parent.classList.add("o_has_treeEntry");
                    placeholder.classList.add("o_treeEntry");
                    const parentSectionId = parseInt(newGroup.dataset.sectionId);
                    const parentValueId = parseInt(parent.dataset.valueId);
                    this.state.expanded[parentSectionId][parentValueId] = true;
                } else {
                    placeholder.classList.remove("o_treeEntry");
                }
                if (prevPos.parent && !prevPos.parent.querySelector("li")) {
                    prevPos.parent.classList.remove("o_has_treeEntry");
                }
            },
            onDrop: async ({ element, parent, next }) => {
                const draggingFolderId = parseInt(element.dataset.valueId);
                let parentFolderId = parent ? parent.dataset.valueId : false;
                if (!parentFolderId || this._notify_wrong_drop_destination(parentFolderId)) {
                    return;
                }
                if (parentFolderId === "MY") {
                    await this.orm.call(
                        "documents.document",
                        "action_create_shortcut",
                        [draggingFolderId],
                        { location_folder_id : false },
                    );
                    return this.env.searchModel._reloadSearchModel(true);
                } else if (parentFolderId) {
                    parentFolderId = parseInt(parentFolderId);
                }
                await this.orm.call(
                    "documents.document",
                    "action_move_documents",
                    [draggingFolderId, parentFolderId],
                );
                await this.env.searchModel._reloadSearchModel(true);
            },
        });
    }

    isUploadingInFolder(folderId) {
        return Object.values(this.documentUploads).find(
            (upload) => upload.data.get("folder_id") === folderId
        );
    }

    //---------------------------------------------------------------------
    // Edition
    //---------------------------------------------------------------------

    // Support for edition on mobile
    resetLongTouchTimer() {
        if (this.longTouchTimer) {
            browser.clearTimeout(this.longTouchTimer);
            this.longTouchTimer = null;
        }
    }

    onSectionValueTouchStart(ev, section, value) {
        if (!uiUtils.isSmall() || typeof value !== "number") {
            return;
        }
        this.touchStartMs = Date.now();
        if (!this.longTouchTimer) {
            this.longTouchTimer = browser.setTimeout(() => {
                this.openEditPopover(ev, section, value);
                this.resetLongTouchTimer();
            }, LONG_TOUCH_THRESHOLD);
        }
    }

    onSectionValueTouchEnd() {
        const elapsedTime = Date.now() - this.touchStartMs;
        if (elapsedTime < LONG_TOUCH_THRESHOLD) {
            this.resetLongTouchTimer();
        }
    }

    onSectionValueTouchMove() {
        this.resetLongTouchTimer();
    }

    _expandFolder({ folderId }) {
        let needRefresh = false;
        const sectionId = this.sections[0].id;
        for (const folder of this.env.searchModel.getFolderAndParents(
            this.env.searchModel.getFolderById(folderId)
        )) {
            if (!this.state.expanded[sectionId][folder.id]) {
                this.state.expanded[sectionId][folder.id] = true;
                needRefresh = true;
            }
        }
        if (needRefresh) {
            this.render(true);
        }
    }

    async editSectionValue(resModel, resId) {
        this.env.documentsView.bus.trigger("documents-close-preview");
        return this.action.doAction(
            {
                res_model: resModel,
                res_id: resId,
                name: _t("Edit"),
                type: "ir.actions.act_window",
                target: "new",
                views: [[false, "form"]],
                context: {
                    create: false,
                },
            },
            {
                onClose: () => this.env.searchModel._reloadSearchModel(true),
            }
        );
    }

    //---------------------------------------------------------------------
    // Data Transfer
    //---------------------------------------------------------------------

    /**
     * Gives the "dragover" class to the given element or remove it if none
     * is provided.
     * @private
     * @param {HTMLElement} [newDragFocus]
     */
    updateDragOverClass(newDragFocus) {
        const allSelected = this.root.el.querySelectorAll(":scope .o_drag_over_selector");
        for (const selected of allSelected) {
            selected.classList.remove("o_drag_over_selector");
        }
        if (newDragFocus) {
            newDragFocus.classList.add("o_drag_over_selector");
        }
    }

    isValidDragTransfer(section, value, target, dataTransfer) {
        if (dataTransfer.types.includes("o_documents_data")) {
            return (
                value.id &&
                target &&
                target.closest(VALUE_SELECTOR)
            );
        } else if (dataTransfer.types.includes("o_documents_drag_folder")) {
            return (
                section.fieldName === "folder_id" &&
                this.draggingFolder.id !== value.id &&
                this.draggingFolder.parent_folder_id !== value.id &&
                target &&
                target.closest(FOLDER_VALUE_SELECTOR)
            );
        }
        return false;
    }

    /**
     * @param {Object} section
     * @param {Object} value
     * @param {DragEvent} ev
     */
    onDragEnter(section, value, ev) {
        if (!this.isValidDragTransfer(section, value, ev.currentTarget, ev.dataTransfer)) {
            this.updateDragOverClass(null);
            return;
        }
        this.updateDragOverClass(ev.currentTarget);
        if (value.childrenIds && value.childrenIds.length) {
            this.state.expanded[section.id][value.id] = true;
        }
    }

    onDragLeave(section, { relatedTarget, dataTransfer }) {
        if (!this.isValidDragTransfer(section, { id: -1 }, relatedTarget, dataTransfer)) {
            this.updateDragOverClass(null);
        }
    }

    onDragOver(section, value, ev) {
        const currentFolder = this.env.searchModel.getSelectedFolder();
        const dropEffect = value.rootId === "MY" && currentFolder.rootId !== "MY" || ev.ctrlKey ? "link" : "move";
        ev.dataTransfer.dropEffect = dropEffect;
    }

    async onDrop(section, value, ev) {
        this.updateDragOverClass(null);
        if (this.isValidDragTransfer(section, value, ev.relatedTarget, ev.dataTransfer)) {
            return;
        }
        if (ev.dataTransfer.types.includes("o_documents_data")) {
            await this.onDropDocuments(section, value, ev);
        }
    }

    /**
     * Allows the selected kanban cards to be dropped in folders.
     * @private
     * @param {Object} section
     * @param {Object} value
     * @param {DragEvent} ev
     */
    async onDropDocuments(section, value, ev) {
        const { currentTarget, dataTransfer } = ev;
        if (
            currentTarget.querySelector(":scope > .active") || // prevents dropping in the current folder
            !this.isValidDragTransfer(section, value, currentTarget, dataTransfer)
        ) {
            return;
        }
        let target_folder_id = value.id === "MY" ? false : value.id;
        const data = JSON.parse(dataTransfer.getData("o_documents_data"));
        const currentFolder = this.env.searchModel.getSelectedFolder();

        if (this._notify_wrong_drop_destination(value.id)) {
            return;
        }
        if ((currentFolder.id && currentFolder.user_permission !== "edit")
            || value.user_permission !== "edit") {
            return this.notification.add(
                _t("You don't have the rights to move documents to that folder."),
                {
                    title: _t("Access Error"),
                    type: "warning",
                }
            );
        }
        if (currentFolder.id === "TRASH") {
            const model = this.env.model;
            await this.orm.write("documents.document", data.recordIds, { folder_id: value.id });
            await toggleArchive(model, model.root.resModel, data.recordIds, false);
            return;
        }
        // Dropping in 'My Drive'
        if (value.rootId === "MY" && currentFolder.rootId !== "MY") {  // Not from my drive => shortcut
            await this.orm.call("documents.document", "action_create_shortcut", data.recordIds, {
                location_folder_id: false,
            });
            await this.env.searchModel._reloadSearchModel(true);
            return this.notification.add(
                _t("Shortcut created"),
                { title: _t("Done!"), type: "success" }
            );
        }
        if (target_folder_id === "TRASH") {
            const model = this.env.model;
            await toggleArchive(model, model.root.resModel, data.recordIds, true);
            return;
        }
        if (data.lockedCount) {
            this.notification.add(
                _t(
                    "%s file(s) not moved because they are locked by another user",
                    data.lockedCount
                ),
                { title: _t("Partial transfer"), type: "warning" }
            );
        }
        const action_name = ev.ctrlKey ? "action_create_shortcut" : "action_move_documents";
        await this.orm.call("documents.document", action_name, [data.recordIds, target_folder_id]);
        await this.env.searchModel._reloadSearchModel(true);
    }

    _notify_wrong_drop_destination(folderId) {
        if (["RECENT", "SHARED", "COMPANY"].includes(folderId)) {
            this.notification.add(
                _t("You can't create shortcuts in or move documents to this special folder.") +
                    (folderId === "COMPANY" && this.isDocumentManager
                        ? _t(" Perhaps you mean to use the pin action.")
                        : ""),
                {
                    title: _t("Invalid operation"),
                    type: "warning",
                }
            );
            return true;
        }
    }
}
