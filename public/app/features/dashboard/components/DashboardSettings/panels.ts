import angular, { ILocationService, IScope } from 'angular';
import _ from 'lodash';
import config from 'app/core/config';
import { PanelModel } from '../../state';

export class DSInfo {
  name: string;
  url: string;
  count = 0;
  constructor(name: string) {
    this.name = name;
  }
}
export class DashPanelsEditorCtrl {
  dashboard: any;
  stats: any;
  datasources: DSInfo[] = [];
  panels: PanelModel[] = [];
  // Set in the UI
  showAlerts: false;
  showDescription: false;
  showDatasource: false;
  showGridPos: boolean;
  showRepeats: false;
  /** @ngInject */
  constructor(private $scope: IScope & Record<string, any>, private $location: ILocationService) {
    $scope.ctrl = this;
    this.showGridPos = true;
    this.updateStats();
  }
  updateStats() {
    const stats = {
      alerts: 0,
      descriptions: 0,
      repeat: 0,
      skip: {}, // id = true
    };
    const sources: DSInfo[] = [];
    this.panels = _.filter(this.dashboard.panels, panel => {
      if (panel.repeatPanelId) {
        return false;
      }
      if (panel.alert) {
        stats.alerts++;
      }
      if (panel.description) {
        stats.descriptions++;
      }
      if (panel.repeat) {
        stats.repeat++;
      }
      if (panel.datasource) {
        if (_.has(sources, panel.datasource)) {
          sources[panel.datasource].count++;
        } else {
          sources[panel.datasource] = new DSInfo(panel.datasource);
          const cfg = _.get(config.datasources, panel.datasource);
          if (cfg && cfg.id) {
            sources[panel.datasource].url = 'datasources/edit/' + cfg.id;
          }
        }
      }
      return true;
    });
    this.datasources = _.sortBy(_.values(sources), ['-count']);
    this.stats = stats;
  }
  getIconFor(panel: PanelModel) {
    if (panel) {
      const meta = config.panels[panel.type];
      if (_.has(meta, 'info.logos')) {
        const logos = meta.info.logos;
        if (logos.small != null) {
          return logos.small;
        }
        if (logos.large != null) {
          return logos.large;
        }
      }
      if (this.isRow(panel)) {
        return '/public/img/icn-row.svg';
      }
    }
    return '/public/img/icn-panel.svg';
  }
  isRow(panel: PanelModel) {
    return 'row' === panel.type;
  }
  layoutChanged(panel: PanelModel) {
    // trigger grid re-layout.  May change the order
    panel.events.emit('panel-size-changed');
    this.dashboard.events.emit('row-expanded');
    this.updateStats();
  }
  showPanel(panel: PanelModel) {
    // Can't navigate to a row
    if (this.isRow(panel)) {
      return;
    }
    this.$location.search({
      panelId: panel.id,
      fullscreen: true,
    });
  }
  removePanel(panel: PanelModel) {
    this.$scope.appEvent('panel-remove', { panelId: panel.id });
  }
}
function dashPanelsEditor() {
  return {
    restrict: 'E',
    controller: DashPanelsEditorCtrl,
    templateUrl: 'public/app/features/dashboard/components/DashboardSettings/panels.html',
    bindToController: true,
    controllerAs: 'ctrl',
    scope: {
      dashboard: '=',
    },
  };
}
angular.module('grafana.directives').directive('dashPanelsEditor', dashPanelsEditor);
