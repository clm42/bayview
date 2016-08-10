/**
 * Esri © 2015
 **/
define([
    'dojo/_base/declare',
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dijit/_WidgetsInTemplateMixin',
    'dojo/Evented',

    'dojo/_base/lang',
    'dojo/_base/connect',
    'dojo/topic',
    'dojo/parser',
    'dojo/query',
    'dojo/on',
    'dojo/dom-style',
    'dojo/dom-class',
    'dojo/dom-attr',
    'dojo/dom-construct',
    'dojo/promise/all',
    'dijit/registry',

    'core/queryUtils',
    'core/layerUtils',

    './InfoRow',

    'dojo/text!./templates/InfoPanel.html'
  ],

  function(
    declare, WidgetBase, TemplatedMixin, WidgetsInTemplateMixin,
    Evented,
    lang, connect, topic, parser, query, on, domStyle, domClass, domAttr, domConstruct, deferredAll, registry,
    queryUtils, layerUtils,
    InfoRow,
    template
  ) {

    return declare([WidgetBase, TemplatedMixin, WidgetsInTemplateMixin, Evented], {

        templateString: template,
        widgetsInTemplate: true,

        constructor: function() {},

        postCreate: function() {
            this.inherited(arguments);
            this._clear();

            this.own(on(this.btnDetails, 'click', lang.hitch(this, this._btnDetailsClicked)));
            this.own(on(this.btnAnalyze, 'click', lang.hitch(this, this._btnAnalyzeClicked)));
            this.own(on(this.btnPrint, 'click', lang.hitch(this, this._btnPrintClicked)));
            this.own(on(this.btnExport, 'click', lang.hitch(this, this._btnExportClicked)));
        },

        startup: function() {
        },

        showDetails: function(layerId, selectedFeature) {
            // from the layerId get the infos
            this.layerConfig = this.config[layerId];
            this.selectedFeature = selectedFeature;
            if (this.layerConfig) {
                _.each(this.layerConfig.infos, lang.hitch(this, function(info) {
                    // create a new row
                    // label: info.label
                    // value: selectedFeature[info.field]
                    console.log(info.label + ': ' + selectedFeature.attributes[info.field]);
                    InfoRow({
                        label: info.label,
                        value: selectedFeature.attributes[info.field]
                    }).placeAt(this.detailsContainer);
                }));
                //this._toggleButtons(this.layerConfig);
            }
        },

        showPanel: function() {
            query('#infoPanelWrapper').removeClass('is-hidden');
        },

        hidePanel: function() {
            query('#infoPanelWrapper').addClass('is-hidden');
            dojo.empty(this.detailsContainer);
            dojo.empty(this.bufferContainer);
            dojo.empty(this.analysisContainer);
        },

        _clear: function() {
            this.layerConfig = null;
            this.selectedFeature = null;
            domConstruct.empty(this.detailsContainer);
            domConstruct.empty(this.bufferContainer);
            domConstruct.empty(this.analysisContainer);
        },

        _btnDetailsClicked: function() {
            console.log('details clicked');
        },

        _btnAnalyzeClicked: function() {
            // TODO: show loading
            console.log('analyze clicked');
            var executeObj = Object.create(null);
            _.each(this.layerConfig.analysis.layers, lang.hitch(this, function(layer) {
                var query = queryUtils.createQuery({
                  outFields: [layer.field],
                  outSpatialReference: this.map.spatialReference,
                  returnGeometry: false,
                  geometry: this.selectedFeature.geometry
                });
                var layerInfo = layerUtils.getLayerInfo(this.map, layer.id);
                executeObj[layer.id] = queryUtils.createQueryTaskExecute(layerInfo.url, query);
            }));
            deferredAll(executeObj).then(lang.hitch(this, function(results) {
                // TODO: remove the loading
                console.log('analysis results', results);
                // get the config
                _.each(this.layerConfig.analysis.layers, lang.hitch(this, function(layer) {
                    var result = results[layer.id];
                    if (result && result.features && result.features.length > 0) {
                        // create the output
                        InfoRow({
                            label: layer.label,
                            value: result.features[0].attributes[layer.field]
                        }).placeAt(this.analysisContainer);
                    }
                }));
            }), function(error) {
                // TODO: remove the loading & show some sort of error message
                console.log('error in analysis')
            });

        },

        _btnPrintClicked: function() {
            console.log('print clicked');
        },

        _btnExportClicked: function() {
            console.log('export clicked');
        },

        _toggleButtons: function(layerConfig) {
            console.debug('toggle buttons', layerConfig);
            (this.layerConfig && this.layerConfig.hasDetails) ? domClass.remove(this.btnDetails, 'is-hidden') : domClass.add(this.btnDetails, 'is-hidden');
            (this.layerConfig && this.layerConfig.hasAnalyzeButton) ? domClass.remove(this.btnAnalyze, 'is-hidden') : domClass.add(this.btnAnalyze, 'is-hidden');
            (this.layerConfig && this.layerConfig.hasPrint) ? domClass.remove(this.btnPrint, 'is-hidden') : domClass.add(this.btnPrint, 'is-hidden');
            (this.layerConfig && this.layerConfig.hasExportData) ? domClass.remove(this.btnExport, 'is-hidden') : domClass.add(this.btnExport, 'is-hidden');
        }

    });
  });
