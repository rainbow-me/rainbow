import { Site, browserStateStore } from '.';

describe('BrowserStateStore', () => {
  beforeEach(() => {
    // Reset the store to its initial state before each test
    browserStateStore.setState(
      {
        ...browserStateStore.getState(),
        tabs: [],
      },
      true
    ); // The second argument 'true' is to replace the state instead of merging
  });

  test('should be able to add a tab', () => {
    const { addTab, tabs } = browserStateStore.getState();
    expect(tabs.length).toBe(0);
    addTab({
      title: 'Test Tab',
      isActive: true,
      canGoBack: false,
      canGoForward: false,
      url: 'https://test.com',
      screenshot: 'test_screenshot.png',
      history: [
        {
          title: 'Test Site',
          url: 'https://test.com',
          image: 'test_image.png',
          timestamp: Date.now(),
        } as Site,
      ],
    });
    expect(browserStateStore.getState().tabs.length).toBe(1);
  });

  test('should place new tabs at the end', () => {
    const { addTab } = browserStateStore.getState();
    addTab({
      title: 'First Tab',
      screenshot: '',
      history: [],
      isActive: false,
      url: '',
      canGoBack: false,
      canGoForward: false,
    });
    addTab({
      title: 'Second Tab',
      screenshot: '',
      history: [],
      isActive: false,
      url: '',
      canGoBack: false,
      canGoForward: false,
    });
    const tabs = browserStateStore.getState().tabs;
    expect(tabs[tabs.length - 1].title).toBe('Second Tab');
  });

  test('should be able to delete a tab', () => {
    const { addTab, deleteTab } = browserStateStore.getState();
    addTab({
      title: 'Tab to Delete',
      screenshot: '',
      history: [],
      isActive: false,
      url: '',
      canGoBack: false,
      canGoForward: false,
    });
    expect(browserStateStore.getState().tabs.length).toBe(1);
    deleteTab(0);
    expect(browserStateStore.getState().tabs.length).toBe(0);
  });

  test('should handle deleting the active tab', () => {
    const { addTab, deleteTab, setActiveTab, getActiveTab } = browserStateStore.getState();
    addTab({
      title: 'Active Tab',
      screenshot: '',
      history: [],
      isActive: false,
      url: '',
      canGoBack: false,
      canGoForward: false,
    });
    addTab({
      title: 'Next Tab',
      screenshot: '',
      history: [],
      isActive: false,
      url: '',
      canGoBack: false,
      canGoForward: false,
    });
    setActiveTab(0);
    expect(getActiveTab()?.title).toBe('Active Tab');
    deleteTab(0);
    expect(getActiveTab()?.title).toBe('Next Tab');
  });

  test('should be able to update a tab', () => {
    const { addTab, updateTab } = browserStateStore.getState();
    addTab({
      title: 'Tab to update',
      screenshot: '',
      history: [],
      isActive: false,
      url: '',
      canGoBack: false,
      canGoForward: false,
    });
    updateTab(0, { title: 'Updated Tab' });
    expect(browserStateStore.getState().tabs[0].title).toBe('Updated Tab');
  });

  test('editing a non-existent tab should do nothing', () => {
    const { updateTab } = browserStateStore.getState();
    updateTab(999, { title: 'Ghost Tab' }); // Assuming there's no tab at index 999
    expect(browserStateStore.getState().tabs.length).toBe(0); // No tabs should have been added or modified
  });

  test('should be able to set and get the active tab', () => {
    const { addTab, setActiveTab, getActiveTab } = browserStateStore.getState();
    addTab({
      title: 'First Tab',
      screenshot: '',
      history: [],
      isActive: false,
      url: '',
      canGoBack: false,
      canGoForward: false,
    });
    addTab({
      title: 'Second Tab',
      screenshot: '',
      history: [],
      isActive: false,
      url: '',
      canGoBack: false,
      canGoForward: false,
    });
    setActiveTab(1);
    expect(getActiveTab()?.title).toBe('Second Tab');
  });

  test('setting an active tab should deactivate others', () => {
    const { addTab, setActiveTab } = browserStateStore.getState();
    addTab({ title: 'First Tab', screenshot: '', history: [], isActive: true, canGoBack: false, canGoForward: false, url: '' });
    addTab({ title: 'Second Tab', screenshot: '', history: [], isActive: false, canGoBack: false, canGoForward: false, url: '' });
    setActiveTab(1);
    expect(browserStateStore.getState().tabs[0].isActive).toBe(false);
    expect(browserStateStore.getState().tabs[1].isActive).toBe(true);
  });

  test('deleting the only tab should result in no active tabs', () => {
    const { addTab, deleteTab } = browserStateStore.getState();
    addTab({ title: 'Lonely Tab', screenshot: '', history: [], isActive: true, canGoBack: false, canGoForward: false, url: '' });
    deleteTab(0);
    expect(browserStateStore.getState().tabs.find(tab => tab.isActive)).toBe(undefined);
  });
});
