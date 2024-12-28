# -*- coding: utf-8 -*-
####################################################################################
#                                                                                  #
# Copyright (C) 2016~2025 Dmmsys <guoyihot@outlook.com> Guobower<124358678@qq.com>##
# All Rights Reserved                                                              #
#  Shanghai Hengzao                                                                #
####################################################################################

from odoo import fields, models


class ResConfigSettings(models.TransientModel):
    _inherit = 'res.config.settings'

    deletion_delay = fields.Integer(config_parameter="dmmsys_document_common.deletion_delay", default=30,
                                    help='Delay after permanent deletion of the document in the trash (days)')

    _sql_constraints = [
        ('check_deletion_delay', 'CHECK(deletion_delay >= 0)', 'The deletion delay should be positive.'),
    ]
