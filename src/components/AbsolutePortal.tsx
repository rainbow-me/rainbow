import React, { PropsWithChildren, ReactNode, useEffect, useState } from 'react';
import { StyleProp, ViewStyle, View } from 'react-native';

const absolutePortal = {
  nodes: [] as ReactNode[],
  addNode: (node: ReactNode) => {
    absolutePortal.nodes = [...absolutePortal.nodes, node];
    absolutePortal._notifyListeners();
  },
  removeNode: (node: ReactNode) => {
    absolutePortal.nodes = absolutePortal.nodes.filter(n => n !== node);
    absolutePortal._notifyListeners();
  },
  subscribe: (onChange: (nodes: ReactNode[]) => void) => {
    onChange(absolutePortal.nodes);
    absolutePortal._listeners.add(onChange);
    return () => {
      absolutePortal._listeners.delete(onChange);
    };
  },
  _listeners: new Set<(nodes: ReactNode[]) => void>(),
  _notifyListeners: () => {
    absolutePortal._listeners.forEach(onChange => onChange(absolutePortal.nodes));
  },
};

export const AbsolutePortalRoot = ({ style }: { style?: StyleProp<ViewStyle> }) => {
  const [nodes, setNodes] = useState(absolutePortal.nodes);

  useEffect(() => {
    const unsubscribe = absolutePortal.subscribe(setNodes);
    return () => unsubscribe();
  }, []);

  return <View style={[style, { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'box-none' }]}>{nodes}</View>;
};

export const AbsolutePortal = ({ children }: PropsWithChildren) => {
  useEffect(() => {
    absolutePortal.addNode(children);
    return () => {
      absolutePortal.removeNode(children);
    };
  }, [children]);

  return null;
};
