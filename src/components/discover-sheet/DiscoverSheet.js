import React, { useCallback, useRef, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BaseButton } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
// eslint-disable-next-line import/no-unresolved
import SlackBottomSheet from 'react-native-slack-bottom-sheet';
import { useIsFocused } from 'react-navigation-hooks';
import BottomSheet from 'reanimated-bottom-sheet';
import {
  notifyUnmountBottomSheet,
  useNavigation,
} from '../../navigation/Navigation';

// eslint-disable-next-line import/no-named-as-default-member
const { SpringUtils } = Animated;

const discoverSheetSpring = SpringUtils.makeConfigFromBouncinessAndSpeed({
  ...SpringUtils.makeDefaultConfig(),
  bounciness: 0,
  mass: 1,
  overshootClamping: false,
  restDisplacementThreshold: 0.99,
  restSpeedThreshold: 100,
  speed: 18,
  toss: 6,
});

const Lorem = () => {
  const { navigate } = useNavigation();

  return (
    <View
      style={{
        paddingLeft: 19,
        paddingRight: 19,
      }}
    >
      <BaseButton onPress={() => navigate('ImportSeedPhraseSheet')}>
        <Text style={styles.panelTitle}>Discover</Text>
      </BaseButton>
      <Text>
        At vero eos et accusamus et iusto odio dignissimos ducimus qui
        blanditiis praesentium voluptatum deleniti atque corrupti quos dolores
        et quas molestias excepturi sint occaecati cupiditate non provident,
        similique sunt in culpa qui officia deserunt mollitia animi, id est
        laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita
        distinctio. Nam libero tempore, cum soluta nobis est eligendi optio
        cumque nihil impedit quo minus id quod maxime placeat facere possimus,
        omnis voluptas assumenda est, omnis dolor repellendus. Temporibus autem
        quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet
        ut et voluptates repudiandae sint et molestiae non recusandae. Itaque
        earum rerum hic tenetur a sapiente delectus, ut aut reiciendis
        voluptatibus maiores alias consequatur aut perferendis doloribus
        asperiores repellat. At vero eos et accusamus et iusto odio dignissimos
        ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti
        quos dolores et quas molestias excepturi sint occaecati cupiditate non
        provident, similique sunt in culpa qui officia deserunt mollitia animi,
        id est laborum et dolorum fuga. Et harum quidem rerum facilis est et
        expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi
        optio cumque nihil impedit quo minus id quod maxime placeat facere
        possimus, omnis voluptas assumenda est, omnis dolor repellendus.
        Temporibus autem quibusdam et aut officiis debitis aut rerum
        necessitatibus saepe eveniet ut et voluptates repudiandae sint et
        molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente
        delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut
        perferendis doloribus asperiores repellat. At vero eos et accusamus et
        iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum
        deleniti atque corrupti quos dolores et quas molestias excepturi sint
        occaecati cupiditate non provident, similique sunt in culpa qui officia
        deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem
        rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta
        nobis est eligendi optio cumque nihil impedit quo minus id quod maxime
        placeat facere possimus, omnis voluptas assumenda est, omnis dolor
        repellendus. Temporibus autem quibusdam et aut officiis debitis aut
        rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et
        molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente
        delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut
        perferendis doloribus asperiores repellat. At vero eos et accusamus et
        iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum
        deleniti atque corrupti quos dolores et quas molestias excepturi sint
        occaecati cupiditate non provident, similique sunt in culpa qui officia
        deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem
        rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta
        nobis est eligendi optio cumque nihil impedit quo minus id quod maxime
        placeat facere possimus, omnis voluptas assumenda est, omnis dolor
        repellendus. Temporibus autem quibusdam et aut officiis debitis aut
        rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et
        molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente
        delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut
        perferendis doloribus asperiores repellat. At vero eos et accusamus et
        iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum
        deleniti atque corrupti quos dolores et quas molestias excepturi sint
        occaecati cupiditate non provident, similique sunt in culpa qui officia
        deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem
        rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta
        nobis est eligendi optio cumque nihil impedit quo minus id quod maxime
        placeat facere possimus, omnis voluptas assumenda est, omnis dolor
        repellendus. Temporibus autem quibusdam et aut officiis debitis aut
        rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et
        molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente
        delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut
        perferendis doloribus asperiores repellat. At vero eos et accusamus et
        iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum
        deleniti atque corrupti quos dolores et quas molestias excepturi sint
        occaecati cupiditate non provident, similique sunt in culpa qui officia
        deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem
        rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta
        nobis est eligendi optio cumque nihil impedit quo minus id quod maxime
        placeat facere possimus, omnis voluptas assumenda est, omnis dolor
        repellendus. Temporibus autem quibusdam et aut officiis debitis aut
        rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et
        molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente
        delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut
        perferendis doloribus asperiores repellat. At vero eos et accusamus et
        iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum
        deleniti atque corrupti quos dolores et quas molestias excepturi sint
        occaecati cupiditate non provident, similique sunt in culpa qui officia
        deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem
        rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta
        nobis est eligendi optio cumque nihil impedit quo minus id quod maxime
        placeat facere possimus, omnis voluptas assumenda est, omnis dolor
        repellendus. Temporibus autem quibusdam et aut officiis debitis aut
        rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et
        molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente
        delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut
        perferendis doloribus asperiores repellat. At vero eos et accusamus et
        iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum
        deleniti atque corrupti quos dolores et quas molestias excepturi sint
        occaecati cupiditate non provident, similique sunt in culpa qui officia
        deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem
        rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta
        nobis est eligendi optio cumque nihil impedit quo minus id quod maxime
        placeat facere possimus, omnis voluptas assumenda est, omnis dolor
        repellendus. Temporibus autem quibusdam et aut officiis debitis aut
        rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et
        molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente
        delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut
        perferendis doloribus asperiores repellat. At vero eos et accusamus et
        iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum
        deleniti atque corrupti quos dolores et quas molestias excepturi sint
        occaecati cupiditate non provident, similique sunt in culpa qui officia
        deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem
        rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta
        nobis est eligendi optio cumque nihil impedit quo minus id quod maxime
        placeat facere possimus, omnis voluptas assumenda est, omnis dolor
        repellendus. Temporibus autem quibusdam et aut officiis debitis aut
        rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et
        molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente
        delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut
        perferendis doloribus asperiores repellat. At vero eos et accusamus et
        iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum
        deleniti atque corrupti quos dolores et quas molestias excepturi sint
        occaecati cupiditate non provident, similique sunt in culpa qui officia
        deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem
        rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta
        nobis est eligendi optio cumque nihil impedit quo minus id quod maxime
        placeat facere possimus, omnis voluptas assumenda est, omnis dolor
        repellendus. Temporibus autem quibusdam et aut officiis debitis aut
        rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et
        molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente
        delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut
        perferendis doloribus asperiores repellat. At vero eos et accusamus et
        iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum
        deleniti atque corrupti quos dolores et quas molestias excepturi sint
        occaecati cupiditate non provident, similique sunt in culpa qui officia
        deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem
        rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta
        nobis est eligendi optio cumque nihil impedit quo minus id quod maxime
        placeat facere possimus, omnis voluptas assumenda est, omnis dolor
        repellendus. Temporibus autem quibusdam et aut officiis debitis aut
        rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et
        molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente
        delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut
        perferendis doloribus asperiores repellat. At vero eos et accusamus et
        iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum
        deleniti atque corrupti quos dolores et quas molestias excepturi sint
        occaecati cupiditate non provident, similique sunt in culpa qui officia
        deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem
        rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta
        nobis est eligendi optio cumque nihil impedit quo minus id quod maxime
        placeat facere possimus, omnis voluptas assumenda est, omnis dolor
        repellendus. Temporibus autem quibusdam et aut officiis debitis aut
        rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et
        molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente
        delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut
        perferendis doloribus asperiores repellat. At vero eos et accusamus et
        iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum
        deleniti atque corrupti quos dolores et quas molestias excepturi sint
        occaecati cupiditate non provident, similique sunt in culpa qui officia
        deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem
        rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta
        nobis est eligendi optio cumque nihil impedit quo minus id quod maxime
        placeat facere possimus, omnis voluptas assumenda est, omnis dolor
        repellendus. Temporibus autem quibusdam et aut officiis debitis aut
        rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et
        molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente
        delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut
        perferendis doloribus asperiores repellat. At vero eos et accusamus et
        iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum
        deleniti atque corrupti quos dolores et quas molestias excepturi sint
        occaecati cupiditate non provident, similique sunt in culpa qui officia
        deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem
        rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta
        nobis est eligendi optio cumque nihil impedit quo minus id quod maxime
        placeat facere possimus, omnis voluptas assumenda est, omnis dolor
        repellendus. Temporibus autem quibusdam et aut officiis debitis aut
        rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et
        molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente
        delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut
        perferendis doloribus asperiores repellat. At vero eos et accusamus et
        iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum
        deleniti atque corrupti quos dolores et quas molestias excepturi sint
        occaecati cupiditate non provident, similique sunt in culpa qui officia
        deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem
        rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta
        nobis est eligendi optio cumque nihil impedit quo minus id quod maxime
        placeat facere possimus, omnis voluptas assumenda est, omnis dolor
        repellendus. Temporibus autem quibusdam et aut officiis debitis aut
        rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et
        molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente
        delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut
        perferendis doloribus asperiores repellat. At vero eos et accusamus et
        iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum
        deleniti atque corrupti quos dolores et quas molestias excepturi sint
        occaecati cupiditate non provident, similique sunt in culpa qui officia
        deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem
        rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta
        nobis est eligendi optio cumque nihil impedit quo minus id quod maxime
        placeat facere possimus, omnis voluptas assumenda est, omnis dolor
        repellendus. Temporibus autem quibusdam et aut officiis debitis aut
        rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et
        molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente
        delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut
        perferendis doloribus asperiores repellat. At vero eos et accusamus et
        iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum
        deleniti atque corrupti quos dolores et quas molestias excepturi sint
        occaecati cupiditate non provident, similique sunt in culpa qui officia
        deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem
        rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta
        nobis est eligendi optio cumque nihil impedit quo minus id quod maxime
        placeat facere possimus, omnis voluptas assumenda est, omnis dolor
        repellendus. Temporibus autem quibusdam et aut officiis debitis aut
        rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et
        molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente
        delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut
        perferendis doloribus asperiores repellat. At vero eos et accusamus et
        iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum
        deleniti atque corrupti quos dolores et quas molestias excepturi sint
        occaecati cupiditate non provident, similique sunt in culpa qui officia
        deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem
        rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta
        nobis est eligendi optio cumque nihil impedit quo minus id quod maxime
        placeat facere possimus, omnis voluptas assumenda est, omnis dolor
        repellendus. Temporibus autem quibusdam et aut officiis debitis aut
        rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et
        molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente
        delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut
        perferendis doloribus asperiores repellat. At vero eos et accusamus et
        iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum
        deleniti atque corrupti quos dolores et quas molestias excepturi sint
        occaecati cupiditate non provident, similique sunt in culpa qui officia
        deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem
        rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta
        nobis est eligendi optio cumque nihil impedit quo minus id quod maxime
        placeat facere possimus, omnis voluptas assumenda est, omnis dolor
        repellendus. Temporibus autem quibusdam et aut officiis debitis aut
        rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et
        molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente
        delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut
        perferendis doloribus asperiores repellat. At vero eos et accusamus et
        iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum
        deleniti atque corrupti quos dolores et quas molestias excepturi sint
        occaecati cupiditate non provident, similique sunt in culpa qui officia
        deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem
        rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta
        nobis est eligendi optio cumque nihil impedit quo minus id quod maxime
        placeat facere possimus, omnis voluptas assumenda est, omnis dolor
        repellendus. Temporibus autem quibusdam et aut officiis debitis aut
        rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et
        molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente
        delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut
        perferendis doloribus asperiores repellat. At vero eos et accusamus et
        iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum
        deleniti atque corrupti quos dolores et quas molestias excepturi sint
        occaecati cupiditate non provident, similique sunt in culpa qui officia
        deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem
        rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta
        nobis est eligendi optio cumque nihil impedit quo minus id quod maxime
        placeat facere possimus, omnis voluptas assumenda est, omnis dolor
        repellendus. Temporibus autem quibusdam et aut officiis debitis aut
        rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et
        molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente
        delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut
        perferendis doloribus asperiores repellat. At vero eos et accusamus et
        iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum
        deleniti atque corrupti quos dolores et quas molestias excepturi sint
        occaecati cupiditate non provident, similique sunt in culpa qui officia
        deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem
        rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta
        nobis est eligendi optio cumque nihil impedit quo minus id quod maxime
        placeat facere possimus, omnis voluptas assumenda est, omnis dolor
        repellendus. Temporibus autem quibusdam et aut officiis debitis aut
        rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et
        molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente
        delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut
        perferendis doloribus asperiores repellat. At vero eos et accusamus et
        iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum
        deleniti atque corrupti quos dolores et quas molestias excepturi sint
        occaecati cupiditate non provident, similique sunt in culpa qui officia
        deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem
        rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta
        nobis est eligendi optio cumque nihil impedit quo minus id quod maxime
        placeat facere possimus, omnis voluptas assumenda est, omnis dolor
        repellendus. Temporibus autem quibusdam et aut officiis debitis aut
        rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et
        molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente
        delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut
        perferendis doloribus asperiores repellat. At vero eos et accusamus et
        iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum
        deleniti atque corrupti quos dolores et quas molestias excepturi sint
        occaecati cupiditate non provident, similique sunt in culpa qui officia
        deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem
        rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta
        nobis est eligendi optio cumque nihil impedit quo minus id quod maxime
        placeat facere possimus, omnis voluptas assumenda est, omnis dolor
        repellendus. Temporibus autem quibusdam et aut officiis debitis aut
        rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et
        molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente
        delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut
        perferendis doloribus asperiores repellat. At vero eos et accusamus et
        iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum
        deleniti atque corrupti quos dolores et quas molestias excepturi sint
        occaecati cupiditate non provident, similique sunt in culpa qui officia
        deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem
        rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta
        nobis est eligendi optio cumque nihil impedit quo minus id quod maxime
        placeat facere possimus, omnis voluptas assumenda est, omnis dolor
        repellendus. Temporibus autem quibusdam et aut officiis debitis aut
        rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et
        molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente
        delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut
        perferendis doloribus asperiores repellat. At vero eos et accusamus et
        iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum
        deleniti atque corrupti quos dolores et quas molestias excepturi sint
        occaecati cupiditate non provident, similique sunt in culpa qui officia
        deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem
        rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta
        nobis est eligendi optio cumque nihil impedit quo minus id quod maxime
        placeat facere possimus, omnis voluptas assumenda est, omnis dolor
        repellendus. Temporibus autem quibusdam et aut officiis debitis aut
        rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et
        molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente
        delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut
        perferendis doloribus asperiores repellat. At vero eos et accusamus et
        iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum
        deleniti atque corrupti quos dolores et quas molestias excepturi sint
        occaecati cupiditate non provident, similique sunt in culpa qui officia
        deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem
        rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta
        nobis est eligendi optio cumque nihil impedit quo minus id quod maxime
        placeat facere possimus, omnis voluptas assumenda est, omnis dolor
        repellendus. Temporibus autem quibusdam et aut officiis debitis aut
        rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et
        molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente
        delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut
        perferendis doloribus asperiores repellat. At vero eos et accusamus et
        iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum
        deleniti atque corrupti quos dolores et quas molestias excepturi sint
        occaecati cupiditate non provident, similique sunt in culpa qui officia
        deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem
        rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta
        nobis est eligendi optio cumque nihil impedit quo minus id quod maxime
        placeat facere possimus, omnis voluptas assumenda est, omnis dolor
        repellendus. Temporibus autem quibusdam et aut officiis debitis aut
        rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et
        molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente
        delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut
        perferendis doloribus asperiores repellat.
      </Text>
    </View>
  );
};

function renderInner() {
  return (
    <View
      style={{
        backgroundColor: 'white',
        paddingTop: 12,
      }}
    >
      <View style={styles.header}>
        <View style={styles.panelHeader}>
          <View style={styles.panelHandle} />
        </View>
      </View>
      <Lorem />
    </View>
  );
}

export function SlackBottomSheetContent() {
  return (
    <View style={StyleSheet.absoluteFillObject}>
      <ScrollView
        style={{
          backgroundColor: 'white',
          marginBottom: -20,
          opacity: 1,
          paddingTop: 12,
        }}
        contentContainerStyle={{ marginBottom: 20 }}
      >
        <Lorem />
      </ScrollView>
    </View>
  );
}

function DiscoverSheet() {
  const [initialPosition, setInitialPosition] = useState('long');
  const position = useRef({ x: 0, y: 0 });
  const setPosition = useCallback(
    ({ nativeEvent: { contentOffset } }) => (position.current = contentOffset),
    []
  );
  const isFocused = useIsFocused();
  // noinspection JSConstructorReturnsPrimitive
  return Platform.OS === 'ios' ? (
    <SlackBottomSheet
      onDidDismiss={notifyUnmountBottomSheet}
      topOffset={100}
      unmountAnimation={false}
      initialAnimation={false}
      presentGlobally={false}
      backgroundOpacity={0}
      allowsDragToDismiss={false}
      allowsTapToDismiss={false}
      isHapticFeedbackEnabled={false}
      onWillTransition={({ type }) => setInitialPosition(type)}
      blocksBackgroundTouches={false}
      startFromShortForm={initialPosition === 'short'}
      interactsWithOuterScrollView
      scrollsToTopOnTapStatusBar={isFocused}
    >
      <View style={StyleSheet.absoluteFillObject}>
        <ScrollView
          style={{
            backgroundColor: 'white',
            marginBottom: -20,
            opacity: 1,
            paddingTop: 12,
          }}
          contentOffset={position.current}
          onScrollEndDrag={setPosition}
          onMomentumScrollEnd={setPosition}
          contentContainerStyle={{ marginBottom: 20 }}
        >
          <Lorem />
        </ScrollView>
      </View>
    </SlackBottomSheet>
  ) : (
    <BottomSheet
      borderRadius={20}
      renderContent={renderInner}
      overdragResistanceFactor={0}
      snapPoints={[300, 744]}
      springConfig={discoverSheetSpring}
    />
  );
}

export default DiscoverSheet;

const styles = StyleSheet.create({
  panelHandle: {
    backgroundColor: '#3C4252',
    borderRadius: 2.5,
    height: 5,
    marginBottom: 10,
    opacity: 0.3,
    width: 36,
  },
  panelHeader: {
    alignItems: 'center',
  },
  panelTitle: {
    fontSize: 27,
    fontWeight: '700',
    letterSpacing: -0.4,
    marginBottom: 10,
  },
});
