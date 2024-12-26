/* @odoo-module */

import { DocumentsAccessSettings } from "@dmmsys_document_common/components/documents_permission_panel/documents_access_settings";
import { patch } from "@web/core/utils/patch";

patch(DocumentsAccessSettings.prototype, {
    errorAccessInternalEdit: {},
    internalAdditionalLabel: {},
});
