// Libraries
import React, { PureComponent, memo, FormEvent } from 'react';
import { css, cx } from 'emotion';

// Components
import { Tooltip } from '../Tooltip/Tooltip';
import { Icon } from '../Icon/Icon';
import { TimePickerContent } from './TimeRangePicker/TimePickerContent';
import { ClickOutsideWrapper } from '../ClickOutsideWrapper/ClickOutsideWrapper';

// Utils & Services
import { stylesFactory } from '../../themes/stylesFactory';
import { withTheme, useTheme } from '../../themes/ThemeContext';
import { toDuration } from '@grafana/data';

// Types
import { rangeUtil, GrafanaTheme, dateTimeFormat, timeZoneFormatUserFriendly } from '@grafana/data';
import { TimeRange, TimeZone, dateMath } from '@grafana/data';
import { Themeable } from '../../types';
import { otherOptions, quickOptions } from './rangeOptions';

const getStyles = stylesFactory((theme: GrafanaTheme) => {
  return {
    container: css`
      position: relative;
      display: flex;
      flex-flow: column nowrap;
    `,
    buttons: css`
      display: flex;
    `,
    caretIcon: css`
      margin-left: ${theme.spacing.xs};
    `,
    clockIcon: css`
      margin-left: ${theme.spacing.xs};
      margin-right: ${theme.spacing.xs};
    `,
    noRightBorderStyle: css`
      label: noRightBorderStyle;
      border-right: 0;
    `,
  };
});

const getLabelStyles = stylesFactory((theme: GrafanaTheme) => {
  return {
    container: css`
      display: inline-block;
    `,
    utc: css`
      color: ${theme.palette.orange};
      font-size: 75%;
      padding: 3px;
      font-weight: ${theme.typography.weight.semibold};
    `,
  };
});

export interface Props extends Themeable {
  hideText?: boolean;
  value: TimeRange;
  timeZone?: TimeZone;
  timeSyncButton?: JSX.Element;
  isSynced?: boolean;
  defaultTimeButton?: JSX.Element;
  onChange: (timeRange: TimeRange) => void;
  onChangeTimeZone: (timeZone: TimeZone) => void;
  onMoveBackward: () => void;
  onMoveForward: () => void;
  onZoom: () => void;
  history?: TimeRange[];
  isLocked?: boolean;
}

export interface State {
  isOpen: boolean;
}

export class UnthemedTimeRangePicker extends PureComponent<Props, State> {
  state: State = {
    isOpen: false,
  };

  onChange = (timeRange: TimeRange) => {
    this.props.onChange(timeRange);
    this.setState({ isOpen: false });
  };

  onOpen = (event: FormEvent<HTMLButtonElement>) => {
    if (!this.props.isLocked) {
      event.stopPropagation();
      const { isOpen } = this.state;
      this.setState({ isOpen: !isOpen });
      event.stopPropagation();
      this.setState({ isOpen: !isOpen });
    }
  };

  onClose = () => {
    this.setState({ isOpen: false });
  };

  render() {
    const {
      value,
      onMoveBackward,
      onMoveForward,
      onZoom,
      timeZone,
      timeSyncButton,
      isSynced,
      defaultTimeButton,
      theme,
      history,
      onChangeTimeZone,
    } = this.props;

    const { isOpen } = this.state;
    const styles = getStyles(theme);
    const hasAbsolute = true;
    const syncedTimePicker = timeSyncButton && isSynced;
    const timePickerIconClass = cx({ ['icon-brand-gradient']: syncedTimePicker });
    const timePickerButtonClass = cx('btn navbar-button navbar-button--tight', {
      [`btn--radius-right-0 ${styles.noRightBorderStyle}`]: !!timeSyncButton,
      [`explore-active-button`]: syncedTimePicker,
    });

    return (
      <div className={styles.container}>
        <div className={styles.buttons}>
          {hasAbsolute && (
            <button className="btn navbar-button navbar-button--tight" onClick={onMoveBackward}>
              <Icon name="angle-left" size="lg" />
            </button>
          )}
          <div>
            <Tooltip content={<TimePickerTooltip timeRange={value} timeZone={timeZone} />} placement="bottom">
              <button aria-label="TimePicker Open Button" className={timePickerButtonClass} onClick={this.onOpen}>
                <Icon name="clock-nine" className={cx(styles.clockIcon, timePickerIconClass)} size="lg" />
                <TimePickerButtonLabel {...this.props} />
                <span className={styles.caretIcon}>{<Icon name={isOpen ? 'angle-up' : 'angle-down'} size="lg" />}</span>
              </button>
            </Tooltip>
            {isOpen && (
              <ClickOutsideWrapper includeButtonPress={false} onClick={this.onClose}>
                <TimePickerContent
                  timeZone={timeZone}
                  value={value}
                  onChange={this.onChange}
                  otherOptions={otherOptions}
                  quickOptions={quickOptions}
                  history={history}
                  showHistory
                  onChangeTimeZone={onChangeTimeZone}
                />
              </ClickOutsideWrapper>
            )}
          </div>

          {timeSyncButton}

          {hasAbsolute && (
            <button className="btn navbar-button navbar-button--tight" onClick={onMoveForward}>
              <Icon name="angle-right" size="lg" />
            </button>
          )}

          <Tooltip content={ZoomOutTooltip} placement="bottom">
            <button className="btn navbar-button navbar-button--zoom" onClick={onZoom}>
              <Icon name="search-minus" size="lg" />
            </button>
          </Tooltip>
          {defaultTimeButton}
        </div>
      </div>
    );
  }
}

const ZoomOutTooltip = () => (
  <>
    Time range zoom out <br /> CTRL+Z
  </>
);

const TimePickerDurationAsString = (timeRange: TimeRange) => {
  const diff = timeRange.to.diff(timeRange.from);
  const duration = toDuration(diff);
  const days = Math.floor(diff / 86400000);
  let rangeLength = '';

  if (days > 10) {
    rangeLength += days.toString() + ' days';
  } else {
    let lines = 0;
    const h = duration.hours();
    const m = duration.minutes();
    const s = duration.seconds();
    if (days > 1) {
      rangeLength += days + ' days';
      lines++;
    } else if (days === 1) {
      rangeLength += '1 day';
      lines++;
    }
    if (h > 0 && lines < 2) {
      if (lines > 0) {
        rangeLength += ' ';
      }
      rangeLength += h + ' hours';
      lines++;
    }
    if (m > 0 && lines < 2) {
      if (lines > 0) {
        rangeLength += ' ';
      }
      rangeLength += m + ' minutes';
      lines++;
    }
    if (lines < 1) {
      rangeLength += duration.asSeconds() + ' seconds';
    } else if (s > 0 && lines < 2) {
      rangeLength += ' ' + s + ' seconds';
    }
  }
  return rangeLength;
};

const TimePickerTooltip = ({ timeRange, timeZone }: { timeRange: TimeRange; timeZone?: TimeZone }) => {
  const theme = useTheme();
  const styles = getLabelStyles(theme);
  const rangeLength = TimePickerDurationAsString(timeRange);

  return (
    <>
      {dateTimeFormat(timeRange.from, { timeZone })}
      <div className="text-center">to</div>
      {dateTimeFormat(timeRange.to, { timeZone })}
      <div className="text-center">
        <span className={styles.utc}>{timeZoneFormatUserFriendly(timeZone)}</span>
      </div>
      <div className="text-center">{rangeLength}</div>
    </>
  );
};

type LabelProps = Pick<Props, 'hideText' | 'value' | 'timeZone'>;

export const TimePickerButtonLabel = memo<LabelProps>(({ hideText, value, timeZone }) => {
  const theme = useTheme();
  const styles = getLabelStyles(theme);

  if (hideText) {
    return null;
  }

  return (
    <span className={styles.container}>
      <span>{formattedRange(value, timeZone)}</span>
      <span className={styles.utc}>{rangeUtil.describeTimeRangeAbbreviation(value, timeZone)}</span>
    </span>
  );
});

const formattedRange = (value: TimeRange, timeZone?: TimeZone) => {
  const adjustedTimeRange = {
    to: dateMath.isMathString(value.raw.to) ? value.raw.to : value.to,
    from: dateMath.isMathString(value.raw.from) ? value.raw.from : value.from,
  };
  return rangeUtil.describeTimeRange(adjustedTimeRange, timeZone);
};

export const TimeRangePicker = withTheme(UnthemedTimeRangePicker);
