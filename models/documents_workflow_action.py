# -*- coding: utf-8 -*-
####################################################################################
#                                                                                  #
# Copyright (C) 2016~2025 Dmmsys <guoyihot@outlook.com> Guobower<124358678@qq.com>##
# All Rights Reserved                                                              #
#  Shanghai Hengzao                                                                #
####################################################################################

from odoo import fields, models


class WorkflowTagAction(models.Model):
    _name = "documents.workflow.action"
    _description = "Document Workflow Tag Action"

    workflow_rule_id = fields.Many2one('documents.workflow.rule', ondelete='cascade')

    action = fields.Selection([
        ('add', "Add"),
        ('replace', "Replace by"),
        ('remove', "Remove"),
    ], default='add', required=True)

    category_id = fields.Many2one('documents.category', string="Category")
    tag_id = fields.Many2one('documents.tag', string="Tag")

    def execute_tag_action(self, document):
        if self.action == 'add' and self.tag_id.id:
            return document.write({'tag_ids': [(4, self.tag_id.id, False)]})
        elif self.action == 'replace' and self.category_id.id:
            categoryed_tags = self.env['documents.tag'].search([('category_id', '=', self.category_id.id)])
            if categoryed_tags.ids:
                for tag in categoryed_tags:
                    document.write({'tag_ids': [(3, tag.id, False)]})
            if self.tag_id:
                return document.write({'tag_ids': [(4, self.tag_id.id, False)]})
        elif self.action == 'remove':
            if self.tag_id.id:
                return document.write({'tag_ids': [(3, self.tag_id.id, False)]})
            elif self.category_id:
                categoryed_tags = self.env['documents.tag'].search([('category_id', '=', self.category_id.id)])
                for tag in categoryed_tags:
                    return document.write({'tag_ids': [(3, tag.id, False)]})
