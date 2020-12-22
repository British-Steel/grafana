import React from 'react';
import { css, cx } from 'emotion';
import { getBackendSrv } from '@grafana/runtime';
import { stylesFactory, IconButton, ThemeContext, styleMixins, CustomScrollbar } from '@grafana/ui';
import { GrafanaTheme } from '@grafana/data';
import { DashboardDTO } from 'app/types';
import { DashboardModel } from 'app/features/dashboard/state/DashboardModel';
import { PanelModel } from 'app/features/dashboard/state/PanelModel';
import { SEARCH_ITEM_HEIGHT, SEARCH_ITEM_MARGIN } from '../constants';

interface Props {
  uid?: string;
  onDismiss: () => void;
}

interface State {
  panels: PanelModel[];
  menuID: string;
}

export class OverlayMenu extends React.PureComponent<Props, State> {
  state: State = {
    panels: [],
    menuID: 'AYSUuF7Gk',
  };

  componentDidMount() {
    this.getMenuLinks();
  }

  getMenuLinks = async () => {
    if (this.props.uid !== undefined) {
      const dash: DashboardDTO = await getBackendSrv().get('/api/dashboards/uid/' + this.props.uid);
      const model = new DashboardModel(dash.dashboard, dash.meta);
      if (model.menuId !== 0) {
        this.setState({ menuID: model.menuId });
      }
    }
    const menu: DashboardDTO = await getBackendSrv().get('/api/dashboards/uid/' + this.state.menuID);
    const model = new DashboardModel(menu.dashboard, menu.meta);
    const panels: PanelModel[] = model.panels.filter(panel => panel.type === 'british-steel-menu-link');
    this.setState({ panels });
  };

  setCurrentMenu = async (linkType: string, menuID: string, dashboardID: string, url: string) => {
    if (linkType === 'menu') {
      const menu: DashboardDTO = await getBackendSrv().get('/api/dashboards/uid/' + menuID);
      const model = new DashboardModel(menu.dashboard, menu.meta);
      const panels: PanelModel[] = model.panels.filter(panel => panel.type === 'british-steel-menu-link');
      this.setState({ panels, menuID });
    } else if (linkType === 'dashboard') {
      if (dashboardID === this.props.uid) {
        this.props.onDismiss();
      } else {
        this.setWindowLocation('/d/' + dashboardID);
      }
    } else {
      this.setWindowLocation(url);
    }
  };

  setWindowLocation(href: string) {
    window.location.href = href;
  }

  render() {
    const { uid, onDismiss } = this.props;
    const { panels, menuID } = this.state;
    return (
      <ThemeContext.Consumer>
        {theme => {
          const styles = getStyles(theme);
          return (
            <div tabIndex={0} className={styles.overlay}>
              <div className={styles.container}>
                <div className={styles.searchField}>
                  <h2 className={styles.title}>
                    Menu - {menuID} - {uid}
                  </h2>
                  <div className={styles.closeBtn}>
                    <IconButton name="times" surface="panel" onClick={onDismiss} size="xxl" tooltip="Close menu" />
                  </div>
                </div>
                <div className={styles.linkContainer}>
                  <CustomScrollbar>
                    <div className={styles.links}>
                      {panels.length > 0 ? (
                        panels.map(panel => (
                          <div
                            aria-label={panel.options.displayName}
                            className={cx(styles.wrapper, {
                              [styles.selected]:
                                panel.options.dashboardLink === this.props.uid &&
                                panel.options.linkType === 'dashboard',
                            })}
                          >
                            <a
                              href="#"
                              className={styles.link}
                              onClick={() =>
                                this.setCurrentMenu(
                                  panel.options.linkType,
                                  panel.options.menuLink,
                                  panel.options.dashboardLink,
                                  panel.options.urlLink
                                )
                              }
                            >
                              <div className={styles.body}>
                                <span>{panel.options.displayName}</span>
                              </div>
                            </a>
                          </div>
                        ))
                      ) : (
                        <h2>No Menus Found</h2>
                      )}
                    </div>
                  </CustomScrollbar>
                </div>
              </div>
            </div>
          );
        }}
      </ThemeContext.Consumer>
    );
  }
}

interface OverlayMenuStyles {
  overlay: string;
  container: string;
  title: string;
  closeBtn: string;
  searchField: string;
  wrapper: string;
  selected: string;
  body: string;
  link: string;
  linkContainer: string;
  links: string;
}

const getStyles = stylesFactory(
  (theme: GrafanaTheme): OverlayMenuStyles => {
    return {
      overlay: css`
        left: 0;
        top: 0;
        right: 0;
        bottom: 0;
        z-index: ${theme.zIndex.sidemenu};
        position: fixed;
        background: ${theme.colors.dashboardBg};

        @media only screen and (min-width: ${theme.breakpoints.md}) {
          left: 60px;
          z-index: ${theme.zIndex.navbarFixed + 1};
        }
      `,
      title: css`
        box-sizing: border-box;
        outline: none;
        background-color: transparent;
        background: transparent;
        border-bottom: 2px solid ${theme.colors.border1};
        font-size: 20px;
        line-height: 38px;
        width: 100%;
      `,
      container: css`
        max-width: 1400px;
        margin: 0 auto;
        padding: ${theme.spacing.md};
        height: 100%;

        @media only screen and (min-width: ${theme.breakpoints.md}) {
          padding: 32px;
        }
      `,
      linkContainer: css`
        padding: 5px;
        position: relative;
        flex-grow: 10;
        margin-bottom: ${theme.spacing.md};
        background: ${theme.colors.bg1};
        border: 1px solid ${theme.colors.border1};
        border-radius: 3px;
        height: 90%;
      `,
      links: css`
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        &:after {
          content: '';
          flex-basis: calc(25% - ${SEARCH_ITEM_MARGIN}px);
        }
      `,
      closeBtn: css`
        right: -5px;
        top: 0px;
        z-index: 1;
        position: absolute;
      `,
      searchField: css`
        position: relative;
      `,
      wrapper: css`
        ${styleMixins.listItem(theme)};
        display: flex;
        height: ${SEARCH_ITEM_HEIGHT}px;
        margin-bottom: ${SEARCH_ITEM_MARGIN}px;
        padding: 0 ${theme.spacing.md};
        flex-basis: 100%;
        &:last-child {
          margin-bottom: ${SEARCH_ITEM_MARGIN * 2}px;
        }
        @media only screen and (min-width: ${theme.breakpoints.lg}) {
          flex-basis: calc(25% - ${SEARCH_ITEM_MARGIN}px);
        }
        @media only screen and (max-width: ${theme.breakpoints.lg}) {
          flex-basis: calc(33% - ${SEARCH_ITEM_MARGIN}px);
        }
        @media only screen and (max-width: ${theme.breakpoints.md}) {
          flex-basis: calc(50% - ${SEARCH_ITEM_MARGIN}px);
        }
        @media only screen and (max-width: ${theme.breakpoints.sm}) {
          flex-basis: 100%;
        }

        :hover {
          cursor: pointer;
        }
      `,
      selected: css`
        ${styleMixins.listItemSelected(theme)};
        border-image: linear-gradient(#f05a28 30%, #fbca0a 99%);
        border-image-slice: 1;
        border-style: solid;
        border-top: 0;
        border-right: 0;
        border-bottom: 0;
        border-left-width: 2px;
        cursor: pointer;
        padding: 0 calc(${theme.spacing.md} - 2px);
      `,
      body: css`
        display: flex;
        flex-direction: column;
        justify-content: center;
        flex: 1 1 auto;
        overflow: hidden;
      `,
      link: css`
        display: flex;
        align-items: center;
        flex-shrink: 0;
        flex-grow: 1;
      `,
    };
  }
);
