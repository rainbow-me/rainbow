import React from 'react';
import { View } from 'react-native';

// This should be a component in the design system, but would need more work
export function Grid({ children, columns = 2, spacing = 10 }: { children: React.ReactNode; columns?: number; spacing?: number }) {
  const rows = React.useMemo(() => {
    const items = React.Children.toArray(children);
    const rowCount = Math.ceil(items.length / columns);
    const result = [];

    for (let i = 0; i < rowCount; i++) {
      result.push(items.slice(i * columns, (i + 1) * columns));
    }

    return result;
  }, [children, columns]);

  return (
    <View style={{ width: '100%' }}>
      {rows.map((row, rowIndex) => (
        <View
          key={rowIndex}
          style={{
            flexDirection: 'row',
            marginBottom: rowIndex === rows.length - 1 ? 0 : spacing,
          }}
        >
          {row.map((item, colIndex) => (
            <View
              key={colIndex}
              style={{
                flex: 1,
                marginRight: colIndex === columns - 1 ? 0 : spacing,
              }}
            >
              {item}
            </View>
          ))}
          {row.length < columns &&
            Array(columns - row.length)
              .fill(null)
              .map((_, index) => (
                <View
                  key={`empty-${index}`}
                  style={{
                    flex: 1,
                    marginRight: index === columns - row.length - 1 ? 0 : spacing,
                  }}
                />
              ))}
        </View>
      ))}
    </View>
  );
}
