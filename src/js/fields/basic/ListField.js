(function($) {

    var Alpaca = $.alpaca;

    Alpaca.Fields.ListField = Alpaca.ControlField.extend(
    /**
     * @lends Alpaca.Fields.ListField.prototype
     */
    {
        /**
         * @see Alpaca.Field#setup
         */
        setup: function()
        {
            var _this = this;

            _this.base();

            _this.selectOptions = [];

            if (_this.getEnum())
            {
                $.each(_this.getEnum(), function(index, value)
                {
                    var text = value;
                    if (_this.options.optionLabels)
                    {
                        if (!Alpaca.isEmpty(_this.options.optionLabels[index]))
                        {
                            text = _this.options.optionLabels[index];
                        }
                        else if (!Alpaca.isEmpty(_this.options.optionLabels[value]))
                        {
                            text = _this.options.optionLabels[value];
                        }
                    }

                    _this.selectOptions.push({
                        "value": value,
                        "text": text
                    });
                });
            }
        },

        /**
         * Gets schema enum property.
         *
         * @returns {Array|String} Field schema enum property.
         */
        getEnum: function()
        {
            if (this.schema && this.schema["enum"])
            {
                return this.schema["enum"];
            }
        },

        /**
         * @see Alpaca.Field#getValue
         */
        getValue: function(val)
        {
            var _this = this;
            if (Alpaca.isArray(val))
            {
                $.each(val, function(index, itemVal) {
                    $.each(_this.selectOptions, function(index2, selectOption) {

                        if (selectOption.value == itemVal)
                        {
                            val[index] = selectOption.value;
                        }

                    });
                });
            }
            else
            {
                $.each(this.selectOptions, function(index, selectOption) {

                    if (selectOption.value == val)
                    {
                        val = selectOption.value;
                    }

                });
            }
            return val;
        },

        /**
         * @see Alpaca.ControlField#beforeRenderControl
         */
        beforeRenderControl: function(model, callback)
        {
            var self = this;

            this.base(model, function() {

                if (self.options.dataSource)
                {
                    if (Alpaca.isFunction(self.options.dataSource))
                    {
                        self.options.dataSource(self, function(values) {

                            if (Alpaca.isArray(values))
                            {
                                for (var i = 0; i < values.length; i++)
                                {
                                    if (typeof(values[i]) == "string")
                                    {
                                        self.selectOptions.push({
                                            "text": values[i],
                                            "value": values[i]
                                        });
                                    }
                                    else if (Alpaca.isObject(values[i]))
                                    {
                                        self.selectOptions.push(values[i]);
                                    }
                                }
                            }
                            else if (Alpaca.isObject(values))
                            {
                                for (var k in values)
                                {
                                    self.selectOptions.push({
                                        "text": k,
                                        "value": values[k]
                                    });
                                }
                            }

                            callback();
                        });
                    }
                    else
                    {
                        if (Alpaca.isUri(self.options.dataSource))
                        {
                            $.ajax({
                                url: self.options.dataSource,
                                type: "get",
                                dataType: "json",
                                success: function(jsonDocument) {

                                    var ds = jsonDocument;
                                    if (self.options.dsTransformer && Alpaca.isFunction(self.options.dsTransformer))
                                    {
                                        ds = self.options.dsTransformer(ds);
                                    }

                                    if (ds)
                                    {
                                        if (Alpaca.isObject(ds))
                                        {
                                            // for objects, we walk through one key at a time
                                            // the insertion order is the order of the keys from the map
                                            // to preserve order, consider using an array as below
                                            $.each(ds, function(key, value) {
                                                self.selectOptions.push({
                                                    "value": key,
                                                    "text": value
                                                });
                                            });
                                        }
                                        else if (Alpaca.isArray(ds))
                                        {
                                            // for arrays, we walk through one index at a time
                                            // the insertion order is dictated by the order of the indices into the array
                                            // this preserves order
                                            $.each(ds, function(index, value) {
                                                self.selectOptions.push({
                                                    "value": value.value,
                                                    "text": value.text
                                                });
                                            });
                                        }
                                    }

                                    callback();
                                },
                                "error": function(jqXHR, textStatus, errorThrown) {

                                    self.errorCallback({
                                        "message":"Unable to load data from uri : " + _this.options.dataSource,
                                        "stage": "DATASOURCE_LOADING_ERROR",
                                        "details": {
                                            "jqXHR" : jqXHR,
                                            "textStatus" : textStatus,
                                            "errorThrown" : errorThrown
                                        }
                                    });
                                }
                            });
                        }
                        else
                        {
                            var ds = self.options.dataSource;
                            if (self.options.dsTransformer && Alpaca.isFunction(self.options.dsTransformer))
                            {
                                ds = self.options.dsTransformer(ds);
                            }

                            if (ds)
                            {
                                if (Alpaca.isArray(ds))
                                {
                                    $.each(ds, function(index, value) {
                                        self.selectOptions.push({
                                            "value": value,
                                            "text": value
                                        });
                                    });
                                }

                                if (Alpaca.isObject(ds))
                                {
                                    for (var index in ds)
                                    {
                                        self.selectOptions.push({
                                            "value": index,
                                            "text": ds[index]
                                        });
                                    }
                                }

                                callback();
                            }
                        }
                    }
                }
                else
                {
                    callback();
                }

            });

        },//__BUILDER_HELPERS

        /**
         * @private
         * @see Alpaca.ControlField#getSchemaOfSchema
         */
        getSchemaOfSchema: function() {
            return Alpaca.merge(this.base(), {
                "properties": {
                    "enum": {
                        "title": "Enumeration",
                        "description": "List of field value options",
                        "type": "array",
                        "required": true
                    }
                }
            });
        },

        /**
         * @private
         * @see Alpaca.ControlField#getSchemaOfOptions
         */
        getSchemaOfOptions: function() {
            return Alpaca.merge(this.base(), {
                "properties": {
                    "optionLabels": {
                        "title": "Option Labels",
                        "description": "Labels for options. It can either be a map object or an array field that maps labels to items defined by enum schema property one by one.",
                        "type": "array"
                    },
                    "dataSource": {
                        "title": "Option Datasource",
                        "description": "Datasource for generating list of options.  This can be a string or a function.  If a string, it is considered to be a URI to a service that produces a object containing key/value pairs or an array of elements of structure {'text': '', 'value': ''}.  This can also be a function that is called to produce the same list.",
                        "type": "string"
                    },
                    "removeDefaultNone": {
                        "title": "Remove Default None",
                        "description": "If true, the default 'None' option will not be shown.",
                        "type": "boolean",
                        "default": false
                    }
                }
            });
        },

        /**
         * @private
         * @see Alpaca.ControlField#getOptionsForOptions
         */
        getOptionsForOptions: function() {
            return Alpaca.merge(this.base(), {
                "fields": {
                    "optionLabels": {
                        "itemLabel":"Label",
                        "type": "array"
                    },
                    "dataSource": {
                        "type": "text"
                    },
                    "removeDefaultNone": {
                        "type": "checkbox",
                        "rightLabel": "Remove Default None"
                    }
                }
            });
        }//__END_OF_BUILDER_HELPERS
    });
})(jQuery);
