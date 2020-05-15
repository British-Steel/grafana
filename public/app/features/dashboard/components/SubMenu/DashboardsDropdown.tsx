import React, { PureComponent } from 'react';
import { Icon } from '@grafana/ui';
import { sanitize, sanitizeUrl } from '@grafana/data/src/text/sanitize';
import { getBackendSrv } from 'app/core/services/backend_srv';
import { css } from 'emotion';
import { DashboardSearchHit } from 'app/features/search/types';
import { getLinkSrv } from '../../../panel/panellinks/link_srv';
import { DashboardLink } from '../../state/DashboardModel';

interface Props {
  link: DashboardLink;
  linkInfo: { title: string; href: string };
  excludeCurrent: boolean;
  dashboardId: any;
}

interface State {
  searchHits: DashboardSearchHit[];
}

export class DashboardsDropdown extends PureComponent<Props, State> {
  state = { searchHits: [] as DashboardSearchHit[] };
  onDropDownClick = async () => {
    const { dashboardId, link, excludeCurrent } = this.props;
    //const { link } = this.props;

    const limit = 50;
    const dashboards = await getBackendSrv().search({ tag: link.tags, limit });
    const processed = dashboards
      .filter(dash => dash.id !== dashboardId || !excludeCurrent)
      .map(dash => {
        return {
          ...dash,
          url: getLinkSrv().getLinkUrl(dash),
        };
      });

    this.setState({
      searchHits: processed,
    });
  };

  render() {
    const { dashboardId, link, linkInfo } = this.props;
    const { searchHits } = this.state;

    return (
      <div className="gf-form">
        <a
          className="gf-form-label pointer"
          target={link.target}
          onClick={this.onDropDownClick}
          data-placement="bottom"
          data-toggle="dropdown"
        >
          <Icon name="bars" />
          <span>{linkInfo.title}</span>
        </a>
        <ul className="dropdown-menu pull-right" role="menu">
          {searchHits.length > 1 &&
            searchHits.map((dashboard: any, index: number) => {
              if (dashboard.id === dashboardId) {
                return (
                  <li
                    key={`${dashboard.id}-${index}`}
                    className={css`
                      border-image: linear-gradient(#f05a28 30%, #fbca0a 99%);
                      border-image-slice: 1;
                      border-style: solid;
                      border-top: 0;
                      border-right: 0;
                      border-bottom: 0;
                      border-left-width: 2px;
                      cursor: pointer;
                    `}
                  >
                    <a href={sanitizeUrl(dashboard.url)} target={dashboard.target}>
                      {sanitize(dashboard.title)}
                    </a>
                  </li>
                );
              }
              return (
                <li
                  key={`${dashboard.id}-${index}`}
                  className={css`
                    border-left: 2px solid rgba(255, 255, 255, 0);
                  `}
                >
                  <a href={sanitizeUrl(dashboard.url)} target={dashboard.target}>
                    {sanitize(dashboard.title)}
                  </a>
                </li>
              );
            })}
        </ul>
      </div>
    );
  }
}
