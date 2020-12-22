// Libaries
import React, { Component } from 'react';
import { dateMath, GrafanaTheme, TimeZone } from '@grafana/data';
import { css } from 'emotion';

// Types
import { DashboardModel } from '../../state';
import { LocationState, CoreEvents } from 'app/types';
import { TimeRange } from '@grafana/data';

// State
import { updateTimeZoneForSession } from 'app/features/profile/state/reducers';

// Components
import { RefreshPicker, withTheme, stylesFactory, Themeable, defaultIntervals } from '@grafana/ui';
import { TimePickerWithHistory } from 'app/core/components/TimePicker/TimePickerWithHistory';
import { DefaultTimeButton } from './DefaultTimeButton';

// Utils & Services
import { getTimeSrv } from 'app/features/dashboard/services/TimeSrv';
import { appEvents } from 'app/core/core';
import store from 'app/core/store';

const getStyles = stylesFactory((theme: GrafanaTheme) => {
  return {
    container: css`
      position: relative;
      display: flex;
    `,
  };
});

const getLockStyles = stylesFactory((theme: GrafanaTheme) => {
  return {
    container: css`
      position: relative;
      display: flex;
      button,
      .navbar-button--attached {
        .fa {
          font-size: 14px;
        }

        border: 1px solid ${theme.palette.orangeDark};
        background-image: none;
        background-color: transparent;
        color: ${theme.palette.orangeDark} !important;

        &:focus {
          background-color: transparent;
        }
        i {
          text-shadow: none;
          background: linear-gradient(180deg, #f05a28 30%, #fbca0a 100%);
          background-clip: text;
          -webkit-text-fill-color: transparent;
          -moz-text-fill-color: transparent;
        }
      }
    `,
  };
});

export interface Props extends Themeable {
  dashboard: DashboardModel;
  location: LocationState;
  onChangeTimeZone: typeof updateTimeZoneForSession;
}
class UnthemedDashNavTimeControls extends Component<Props> {
  componentDidMount() {
    // Only reason for this is that sometimes time updates can happen via redux location changes
    // and this happens before timeSrv has had chance to update state (as it listens to angular route-updated)
    // This can be removed after timeSrv listens redux location
    this.props.dashboard.on(CoreEvents.timeRangeUpdated, this.triggerForceUpdate);
  }

  componentWillUnmount() {
    this.props.dashboard.off(CoreEvents.timeRangeUpdated, this.triggerForceUpdate);
  }

  triggerForceUpdate = () => {
    this.forceUpdate();
  };

  get refreshParamInUrl(): string {
    return this.props.location.query.refresh as string;
  }

  onChangeRefreshInterval = (interval: string) => {
    getTimeSrv().setAutoRefresh(interval);
    this.forceUpdate();
  };

  onRefresh = () => {
    getTimeSrv().refreshDashboard();
    return Promise.resolve();
  };

  onMoveBack = () => {
    appEvents.emit(CoreEvents.shiftTime, -1);
  };

  onMoveForward = () => {
    appEvents.emit(CoreEvents.shiftTime, 1);
  };

  onChangeTimePicker = (timeRange: TimeRange) => {
    const { dashboard } = this.props;
    const panel = dashboard.timepicker;
    const hasDelay = panel.nowDelay && timeRange.raw.to === 'now';

    const adjustedFrom = dateMath.isMathString(timeRange.raw.from) ? timeRange.raw.from : timeRange.from;
    const adjustedTo = dateMath.isMathString(timeRange.raw.to) ? timeRange.raw.to : timeRange.to;
    const nextRange = {
      from: adjustedFrom,
      to: hasDelay ? 'now-' + panel.nowDelay : adjustedTo,
    };

    getTimeSrv().setTime(nextRange);
  };

  onChangeTimeZone = (timeZone: TimeZone) => {
    this.props.dashboard.timezone = timeZone;
    this.props.onChangeTimeZone(timeZone);
    this.onRefresh();
  };

  onZoom = () => {
    appEvents.emit(CoreEvents.zoomOut, 2);
  };

  onDefaultTimeRange = () => {
    appEvents.emit(CoreEvents.defaultTime);
  };

  render() {
    const { dashboard, theme } = this.props;
    const defaultTimeButton = <DefaultTimeButton onClick={this.onDefaultTimeRange} />;
    const { refresh_intervals } = dashboard.timepicker;
    const intervals = getTimeSrv().getValidIntervals(refresh_intervals || defaultIntervals);

    const timePickerValue = getTimeSrv().timeRange();
    const timeZone = dashboard.getTimezone();
    const styles = getStyles(theme);
    const lockStyles = getLockStyles(theme);

    // If range>1 day, don't allow refresh interval to be set, kills datasource
    let refresh = dashboard.refresh;
    let refreshOff = false;
    if (timePickerValue.to.valueOf() - timePickerValue.from.valueOf() > 86400000) {
      refresh = 'Off';
      getTimeSrv().setAutoRefresh('');
      refreshOff = true;
    }

    let style = styles;
    // time locked don't allow refresh intervel to be set
    if (store.getBool('grafana.dashNav.timeLocked', false)) {
      refresh = 'Off';
      getTimeSrv().setAutoRefresh('');
      refreshOff = true;
      style = lockStyles;
    }

    return (
      <div className={style.container}>
        <TimePickerWithHistory
          value={timePickerValue}
          onChange={this.onChangeTimePicker}
          timeZone={timeZone}
          onMoveBackward={this.onMoveBack}
          onMoveForward={this.onMoveForward}
          onZoom={this.onZoom}
          onChangeTimeZone={this.onChangeTimeZone}
          defaultTimeButton={defaultTimeButton}
          isLocked={store.getBool('grafana.dashNav.timeLocked', false)}
        />
        <RefreshPicker
          onIntervalChanged={this.onChangeRefreshInterval}
          onRefresh={this.onRefresh}
          value={refresh}
          intervals={intervals}
          tooltip="Refresh dashboard"
          refreshOff={refreshOff}
        />
      </div>
    );
  }
}

export const DashNavTimeControls = withTheme(UnthemedDashNavTimeControls);
