import React, { FC } from 'react';
import _ from 'lodash';
import TopSectionItem from './TopSectionItem';
import config from '../../config';
import { getCurrentThemeName } from 'app/core/utils/ConfigProvider';
import { getLocationSrv } from '@grafana/runtime';
import { GrafanaThemeType } from '@grafana/data';

const TopSection: FC<any> = () => {
  const navTree = _.cloneDeep(config.bootData.navTree);
  const mainLinks = _.filter(navTree, item => !item.hideFromMenu);
  const searchLink = {
    text: 'Search',
    icon: 'search',
  };

  const menuLink = {
    text: 'Menu',
    icon: 'bars',
  };

  let switchThemeLink = {
    text: 'Switch to dark theme',
    icon: 'moon',
  };

  if (getCurrentThemeName() === GrafanaThemeType.Dark) {
    switchThemeLink = {
      text: 'Switch to light theme',
      icon: 'sun',
    };
  }

  const onOpenSearch = () => {
    getLocationSrv().update({ query: { search: 'open' }, partial: true });
  };

  const onOpenMenu = () => {
    getLocationSrv().update({ query: { search: 'menu' }, partial: true });
  };

  const onToggleTheme = () => {
    if (document.cookie.indexOf('grafana_override_theme=') >= 0) {
      const date = new Date();
      // Set it expire in -1 days
      date.setTime(date.getTime() + -1 * 24 * 60 * 60 * 1000);
      document.cookie = 'grafana_override_theme=; expires=' + date.toUTCString() + '; path=/';
    } else {
      document.cookie = 'grafana_override_theme=true; expires=-1; path=/';
    }
    window.location.reload();
  };

  return (
    <div className="sidemenu__top">
      <TopSectionItem link={menuLink} onClick={onOpenMenu} />
      <TopSectionItem link={searchLink} onClick={onOpenSearch} />
      {mainLinks.map((link, index) => {
        return <TopSectionItem link={link} key={`${link.id}-${index}`} />;
      })}
      <TopSectionItem link={switchThemeLink} onClick={onToggleTheme} />
    </div>
  );
};

export default TopSection;
