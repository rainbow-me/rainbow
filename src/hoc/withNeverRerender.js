import { shouldUpdate } from 'recompact';

const neverUpdate = () => false;

const withNeverRerender = Component => shouldUpdate(neverUpdate)(Component);
export default withNeverRerender;
