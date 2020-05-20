import React from 'react';
import classNames from 'classnames';
import { css } from 'emotion';

import { Tooltip, useTheme, stylesFactory, Icon } from '@grafana/ui';
import { GrafanaTheme } from '@grafana/data';

const getStyles = stylesFactory((theme: GrafanaTheme) => {
  return {
    noRightBorderStyle: css`
      label: noRightBorderStyle;
      border-right: 0;
    `,
    /*
     * Required top-padding, otherwise is fa-link icon in active state
     * cut off on top due to fontAwesome icon position
     */
    topPadding: css`
      label: topPadding;
      padding-top: 1px;
    `,
  };
});

interface DefaultTimeButtonProps {
  onClick: () => void;
}

export function DefaultTimeButton(props: DefaultTimeButtonProps) {
  const { onClick } = props;
  const theme = useTheme();
  const styles = getStyles(theme);

  const defaultTimeTooltip = () => {
    const tooltip = "Return to this dashboard's default time range";
    return <>{tooltip}</>;
  };

  return (
    <Tooltip content={defaultTimeTooltip} placement="bottom">
      <button
        className={classNames('btn navbar-button navbar-button--attached')}
        aria-label="Default time"
        onClick={() => onClick()}
      >
        <Icon name="clock-nine" className={classNames(styles.topPadding)} size="lg" />
      </button>
    </Tooltip>
  );
}
