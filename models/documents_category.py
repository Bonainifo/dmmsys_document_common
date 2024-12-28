# -*- coding: utf-8 -*-
####################################################################################
#                                                                                  #
# Copyright (C) 2016~2025 Dmmsys <guoyihot@outlook.com> Guobower<124358678@qq.com>##
# All Rights Reserved                                                              #
#  Shanghai Hengzao                                                                #
####################################################################################

from odoo import models, fields

N_FACET_COLORS = 11


class DocumentCategory(models.Model):
    _name = "documents.category"
    _description = "Category"
    _order = "sequence, name"

    folder_id = fields.Many2one('documents.folder', string="Workspace", ondelete="cascade")
    name = fields.Char(required=True, translate=True)
    tag_ids = fields.One2many('documents.tag', 'category_id', copy=True)
    tooltip = fields.Char(help="Text shown when hovering on this tag category or its tags", string="Tooltip")
    sequence = fields.Integer('Sequence', default=10)

    _sql_constraints = [
        ('name_unique', 'unique (folder_id, name)', "Category already exists in this folder"),
    ]
