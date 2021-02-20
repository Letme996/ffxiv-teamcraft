import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ListsState } from './lists.reducer';

// Lookup the 'Lists' feature state managed by NgRx
const getListsState = createFeatureSelector<ListsState>('lists');

const getListsLoading = createSelector(
  getListsState,
  (state: ListsState) => !state.listsConnected
);

const getConnectedTeams = createSelector(
  getListsState,
  (state: ListsState) => state.connectedTeams
);

const getNeedsVerification = createSelector(
  getListsState,
  (state: ListsState) => state.needsVerification
);

const getAutocompleteEnabled = createSelector(
  getListsState,
  (state: ListsState) => state.autocompletionEnabled
);

const getCompletionNotificationEnabled = createSelector(
  getListsState,
  (state: ListsState) => state.completionNotificationEnabled
);

const getAllListDetails = createSelector(
  getListsState,
  (state: ListsState) => {
    return state.listDetails.filter(d => state.deleted.indexOf(d.$key) === -1);
  }
);

const getSelectedId = createSelector(
  getListsState,
  (state: ListsState) => state.selectedId
);

const getSelectedList = () => createSelector(
  getAllListDetails,
  getSelectedId,
  (lists, id) => {
    return lists.find(it => it.$key === id);
  }
);

const getPinnedListKey = () => createSelector(
  getListsState,
  (state) => {
    return state.pinned
  }
);

export const listsQuery = {
  getAllListDetails,
  getSelectedList,
  getPinnedListKey,
  getNeedsVerification,
  getAutocompleteEnabled,
  getCompletionNotificationEnabled,
  getListsLoading,
  getConnectedTeams
};
