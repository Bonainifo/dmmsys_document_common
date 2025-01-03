# -*- coding: utf-8 -*-
####################################################################################
#                                                                                  #
# Copyright (C) 2016~2025 Dmmsys <guoyihot@outlook.com> Guobower<124358678@qq.com>##
# All Rights Reserved                                                              #
#  Shanghai Hengzao                                                                #
####################################################################################
{
    'name': "Dmmys Document Common",

    'summary': "Dmmys Document management",

    'description': """
App to upload and manage your documents.
    """,

    'author': "Odoo",
    'category': 'Productivity/Documents',
    'sequence': 80,
    'version': '1.3',
    'application': True,
    'website': 'https://www.odoo.com/app/documents',

    # any module necessary for this one to work correctly
    'depends': ['base', 'mail', 'portal', 'attachment_indexation', 'digest'],

    # always loaded
    'data': [
        'security/security.xml',
        'security/ir.model.access.csv',
        'data/digest_data.xml',
        'data/mail_template_data.xml',

        #'data/documents_folder_data.xml',
        #'data/documents_category_data.xml',
        #'data/documents_tag_data.xml',
        #'data/documents_share_data.xml',

        #'data/documents_workflow_data.xml',
        'data/ir_asset_data.xml',
        'data/ir_config_parameter_data.xml',
        'views/res_config_settings_views.xml',
        'views/res_partner_views.xml',
        'views/documents_document_views.xml',
        'views/documents_category_views.xml',
        'views/documents_folder_views.xml',
        'views/documents_share_views.xml',
        'views/documents_tag_views.xml',
        'views/documents_workflow_action_views.xml',
        'views/documents_workflow_rule_views.xml',

        'views/documents_menu_views.xml',
        'views/documents_templates_share.xml',
        'wizard/documents_link_to_record_wizard_views.xml',
        'wizard/documents_request_wizard_views.xml',
    ],

    'demo': [
        'demo/documents_folder_demo.xml',
        'demo/documents_document_demo.xml',
    ],
    'license': 'OEEL-1',
    'assets': {
        'web.assets_backend': [
            'dmmsys_document_common/static/src/model/**/*',
            'dmmsys_document_common/static/src/scss/documents_views.scss',
            'dmmsys_document_common/static/src/scss/documents_kanban_view.scss',
            'dmmsys_document_common/static/src/attachments/**/*',
            'dmmsys_document_common/static/src/core/**/*',
            'dmmsys_document_common/static/src/js/**/*',
            'dmmsys_document_common/static/src/owl/**/*',
            'dmmsys_document_common/static/src/views/**/*',
            ('remove', 'dmmsys_document_common/static/src/views/activity/**'),
            ('after', 'web/static/src/core/errors/error_dialogs.xml', 'dmmsys_document_common/static/src/web/error_dialog/error_dialog_patch.xml'),
            'dmmsys_document_common/static/src/web/**/*',
            'dmmsys_document_common/static/src/components/**/*',
        ],
        'web.assets_backend_lazy': [
            'dmmsys_document_common/static/src/views/activity/**',
        ],
        'web._assets_primary_variables': [
            'dmmsys_document_common/static/src/scss/documents.variables.scss',
        ],
        "web.dark_mode_variables": [
            ('before', 'dmmsys_document_common/static/src/scss/documents.variables.scss', 'dmmsys_document_common/static/src/scss/documents.variables.dark.scss'),
        ],
        'documents.public_page_assets': [
            ('include', 'web._assets_helpers'),
            ('include', 'web._assets_backend_helpers'),
            'web/static/src/scss/pre_variables.scss',
            'web/static/lib/bootstrap/scss/_variables.scss',
            'web/static/lib/bootstrap/scss/_variables-dark.scss',
            'web/static/lib/bootstrap/scss/_maps.scss',
            ('include', 'web._assets_bootstrap_backend'),
            'dmmsys_document_common/static/src/scss/documents_public_pages.scss',
        ],
        'documents.webclient': [
            ('include', 'web.assets_backend'),
            # documents webclient overrides
            'dmmsys_document_common/static/src/portal_webclient/**/*',
            'web/static/src/start.js',
        ],
        'web.tests_assets': [
            'dmmsys_document_common/static/tests/helpers/**/*',
        ],
        'web.assets_tests': [
            'dmmsys_document_common/static/tests/tours/*',
        ],
        'web.assets_unit_tests': [
            'dmmsys_document_common/static/tests/error_dialog_patch.test.js',
        ],
        'web.qunit_suite_tests': [
            'dmmsys_document_common/static/tests/**/*',
            ('remove', 'dmmsys_document_common/static/tests/**/*mobile_tests.js'),
            ('remove', 'dmmsys_document_common/static/tests/helpers/**/*'),
            ('remove', 'dmmsys_document_common/static/tests/tours/*'),
            ('remove', 'dmmsys_document_common/static/tests/error_dialog_patch.test.js'),
        ],
        'web.qunit_mobile_suite_tests': [
            'dmmsys_document_common/static/tests/documents_test_utils.js',
            'dmmsys_document_common/static/tests/documents_kanban_mobile_tests.js',
        ],
    }
}
