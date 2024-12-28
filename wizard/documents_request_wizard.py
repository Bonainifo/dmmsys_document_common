# -*- coding: utf-8 -*-
####################################################################################
#                                                                                  #
# Copyright (C) 2016~2025 Dmmsys <guoyihot@outlook.com> Guobower<124358678@qq.com>##
# All Rights Reserved                                                              #
#  Shanghai Hengzao                                                                #
####################################################################################

from dateutil.relativedelta import relativedelta
from odoo import api, fields, models
from odoo.tools.misc import clean_context


class RequestWizard(models.TransientModel):
    _name = "documents.request.wizard"
    _description = "Document Request"

    name = fields.Char(required=True)
    requestee_id = fields.Many2one('res.partner', required=True, string="Owner")
    partner_id = fields.Many2one('res.partner', string="Contact")



    tag_ids = fields.Many2many('documents.tag', string="Tags")
    folder_id = fields.Many2one('documents.folder', string="Workspace", required=True)

    res_model = fields.Char('Resource Model')
    res_id = fields.Integer('Resource ID')



    def request_document(self):
        self.ensure_one()
        document = self.env['documents.document'].create({
            'name': self.name,
            'type': 'empty',
            'folder_id': self.folder_id.id,
            'tag_ids': [(6, 0, self.tag_ids.ids if self.tag_ids else [])],
            'owner_id': self.env.user.id,
            'partner_id': self.partner_id.id if self.partner_id else False,
            'res_model': self.res_model,
            'res_id': self.res_id,
        })



        deadline = None


        request_by_mail = self.requestee_id and self.create_uid not in self.requestee_id.user_ids
        if request_by_mail:
            share_vals = {
                'name': self.name,
                'type': 'ids',
                'folder_id': self.folder_id.id,
                'partner_id': self.partner_id.id if self.partner_id else False,
                'owner_id': self.requestee_id.id,
                'document_ids': [(4, document.id)],

            }
            if deadline:
                share_vals['date_deadline'] = deadline
            share = self.env['documents.share'].create(share_vals)
            share.with_context(clean_context(self.env.context)).send_share_by_mail('dmmsys_document_common.mail_template_document_request')
            document.create_share_id = share

        return document
