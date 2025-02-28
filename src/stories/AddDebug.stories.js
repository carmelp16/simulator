import React from 'react';
import { storiesOf } from '@storybook/react';

import { Provider } from 'react-redux';
import { createStore } from 'redux';
import AddDebugReact from 'components/Sidebar/SidebarRight/AddDebug.react';
import rootReducer from 'reducers/root.reducer';
import DrawerOperations from 'components/Drawer/DrawerOperations.react';

const store = createStore(rootReducer);

storiesOf('Basics|AddDebug', module).add('In Drawer', () => (
  <Provider store={store}>
    <DrawerOperations visible={true} operation={'Add Debug'}>
      <AddDebugReact />
    </DrawerOperations>
  </Provider>
));
