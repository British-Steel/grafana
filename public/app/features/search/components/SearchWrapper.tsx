import React, { FC, memo } from 'react';
import { MapDispatchToProps, MapStateToProps } from 'react-redux';
import { UrlQueryMap } from '@grafana/data';
import { getLocationQuery } from 'app/core/selectors/location';
import { updateLocation } from 'app/core/reducers/location';
import { connectWithStore } from 'app/core/utils/connectWithReduxStore';
import { StoreState } from 'app/types';
import DashboardSearch from './DashboardSearch';
import { defaultQueryParams } from '../reducers/searchQueryReducer';
import { OverlayMenu } from './OverlayMenu';

interface OwnProps {
  search?: string | null;
  folder?: string;
  uid?: string;
  queryText?: string;
  filter?: string;
}

interface DispatchProps {
  updateLocation: typeof updateLocation;
}

export type Props = OwnProps & DispatchProps;

export const SearchWrapper: FC<Props> = memo(({ search, folder, uid, updateLocation }) => {
  const isOpen = search === 'open' || search === 'menu';

  const closeSearch = () => {
    if (isOpen) {
      updateLocation({
        query: {
          search: null,
          folder: null,
          ...defaultQueryParams,
        } as UrlQueryMap,
        partial: true,
      });
    }
  };

  if (isOpen) {
    return <DashboardSearch onCloseSearch={closeSearch} folder={folder} />;
  } else if (search === 'menu') {
    return <OverlayMenu uid={uid} onDismiss={closeSearch} />;
  }
  return null;
});

const mapStateToProps: MapStateToProps<{}, OwnProps, StoreState> = (state: StoreState) => {
  const { search, folder } = getLocationQuery(state.location);
  const uid = state.location.routeParams.uid;
  return { search, folder, uid };
};

const mapDispatchToProps: MapDispatchToProps<DispatchProps, OwnProps> = {
  updateLocation,
};

export default connectWithStore(SearchWrapper, mapStateToProps, mapDispatchToProps);
