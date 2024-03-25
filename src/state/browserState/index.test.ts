import { useBrowserStateStore } from '.';

describe('BrowserStateStore', () => {
  beforeEach(() => {
    // Reset the store to its initial state before each test
    useBrowserStateStore.setState(
      {
        tabs: [],
      },
      true
    ); // The second argument 'true' is to replace the state instead of merging
  });

  test('should be able to add a tab', () => {
    const { addTab, tabs } = useBrowserStateStore.getState();
    expect(tabs.length).toBe(0);
    addTab({
      name: 'Test Tab',
      isActive: true,
      screenshot: 'test_screenshot.png',
      history: [
        {
          name: 'Test Site',
          url: 'https://test.com',
          image: 'test_image.png',
          timestamp: Date.now(),
        },
      ],
    });
    expect(useBrowserStateStore.getState().tabs.length).toBe(1);
  });

  test('should place new tabs at the end', () => {
    const { addTab } = useBrowserStateStore.getState();
    addTab({ name: 'First Tab', screenshot: '', history: [], isActive: false });
    addTab({ name: 'Second Tab', screenshot: '', history: [], isActive: false });
    const tabs = useBrowserStateStore.getState().tabs;
    expect(tabs[tabs.length - 1].name).toBe('Second Tab');
  });

  test('should be able to delete a tab', () => {
    const { addTab, deleteTab, tabs } = useBrowserStateStore.getState();
    addTab({ name: 'Tab to Delete', screenshot: '', history: [], isActive: false });
    expect(tabs.length).toBe(1);
    deleteTab(0);
    expect(useBrowserStateStore.getState().tabs.length).toBe(0);
  });

  test('should handle deleting the active tab', () => {
    const { addTab, deleteTab, setActiveTab, getActiveTab } = useBrowserStateStore.getState();
    addTab({ name: 'Active Tab', screenshot: '', history: [], isActive: false });
    addTab({ name: 'Next Tab', screenshot: '', history: [], isActive: false });
    setActiveTab(0);
    expect(getActiveTab()?.name).toBe('Active Tab');
    deleteTab(0);
    expect(getActiveTab()?.name).toBe('Next Tab');
  });

  test('should be able to edit a tab', () => {
    const { addTab, editTab, tabs } = useBrowserStateStore.getState();
    addTab({ name: 'Tab to Edit', screenshot: '', history: [], isActive: false });
    editTab(0, { name: 'Edited Tab' });
    expect(tabs[0].name).toBe('Edited Tab');
  });

  test('editing a non-existent tab should do nothing', () => {
    const { editTab, tabs } = useBrowserStateStore.getState();
    editTab(999, { name: 'Ghost Tab' }); // Assuming there's no tab at index 999
    expect(tabs.length).toBe(0); // No tabs should have been added or modified
  });

  test('should be able to set and get the active tab', () => {
    const { addTab, setActiveTab, getActiveTab } = useBrowserStateStore.getState();
    addTab({ name: 'First Tab', screenshot: '', history: [], isActive: false });
    addTab({ name: 'Second Tab', screenshot: '', history: [], isActive: false });
    setActiveTab(1);
    expect(getActiveTab()?.name).toBe('Second Tab');
  });

  test('setting an active tab should deactivate others', () => {
    const { addTab, setActiveTab, tabs } = useBrowserStateStore.getState();
    addTab({ name: 'First Tab', screenshot: '', history: [], isActive: true });
    addTab({ name: 'Second Tab', screenshot: '', history: [], isActive: false });
    setActiveTab(1);
    expect(tabs[0].isActive).toBe(false);
    expect(tabs[1].isActive).toBe(true);
  });

  test('deleting the only tab should result in no active tabs', () => {
    const { addTab, deleteTab, tabs } = useBrowserStateStore.getState();
    addTab({ name: 'Lonely Tab', screenshot: '', history: [], isActive: true });
    deleteTab(0);
    expect(tabs.find(tab => tab.isActive)).toBe(undefined);
  });
});
