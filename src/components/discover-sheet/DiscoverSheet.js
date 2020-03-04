import React from 'react';
import { StyleSheet, Text, View, Platform, ScrollView } from 'react-native';
import SlackBottomSheet from 'react-native-slack-bottom-sheet';
import BottomSheet from 'reanimated-bottom-sheet';
import Animated from 'react-native-reanimated';

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

const Lorem = () => (
  <View style={{ paddingLeft: 19, paddingRight: 19 }}>
    <Text style={styles.panelTitle}>Discover</Text>
    <Text>
      At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis
      praesentium voluptatum deleniti atque corrupti quos dolores et quas
      molestias excepturi sint occaecati cupiditate non provident, similique
      sunt in culpa qui officia deserunt mollitia animi, id est laborum et
      dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio.
      Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil
      impedit quo minus id quod maxime placeat facere possimus, omnis voluptas
      assumenda est, omnis dolor repellendus. Temporibus autem quibusdam et aut
      officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates
      repudiandae sint et molestiae non recusandae. Itaque earum rerum hic
      tenetur a sapiente delectus, ut aut reiciendis voluptatibus maiores alias
      consequatur aut perferendis doloribus asperiores repellat. At vero eos et
      accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium
      voluptatum deleniti atque corrupti quos dolores et quas molestias
      excepturi sint occaecati cupiditate non provident, similique sunt in culpa
      qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et
      harum quidem rerum facilis est et expedita distinctio. Nam libero tempore,
      cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod
      maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor
      repellendus. Temporibus autem quibusdam et aut officiis debitis aut rerum
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
      repellendus. Temporibus autem quibusdam et aut officiis debitis aut rerum
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
      repellendus. Temporibus autem quibusdam et aut officiis debitis aut rerum
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
      repellendus. Temporibus autem quibusdam et aut officiis debitis aut rerum
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
      repellendus. Temporibus autem quibusdam et aut officiis debitis aut rerum
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
      repellendus. Temporibus autem quibusdam et aut officiis debitis aut rerum
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
      repellendus. Temporibus autem quibusdam et aut officiis debitis aut rerum
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
      repellendus. Temporibus autem quibusdam et aut officiis debitis aut rerum
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
      repellendus. Temporibus autem quibusdam et aut officiis debitis aut rerum
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
      repellendus. Temporibus autem quibusdam et aut officiis debitis aut rerum
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
      repellendus. Temporibus autem quibusdam et aut officiis debitis aut rerum
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
      repellendus. Temporibus autem quibusdam et aut officiis debitis aut rerum
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
      repellendus. Temporibus autem quibusdam et aut officiis debitis aut rerum
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
      repellendus. Temporibus autem quibusdam et aut officiis debitis aut rerum
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
      repellendus. Temporibus autem quibusdam et aut officiis debitis aut rerum
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
      repellendus. Temporibus autem quibusdam et aut officiis debitis aut rerum
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
      repellendus. Temporibus autem quibusdam et aut officiis debitis aut rerum
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
      repellendus. Temporibus autem quibusdam et aut officiis debitis aut rerum
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
      repellendus. Temporibus autem quibusdam et aut officiis debitis aut rerum
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
      repellendus. Temporibus autem quibusdam et aut officiis debitis aut rerum
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
      repellendus. Temporibus autem quibusdam et aut officiis debitis aut rerum
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
      repellendus. Temporibus autem quibusdam et aut officiis debitis aut rerum
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
      repellendus. Temporibus autem quibusdam et aut officiis debitis aut rerum
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
      repellendus. Temporibus autem quibusdam et aut officiis debitis aut rerum
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
      repellendus. Temporibus autem quibusdam et aut officiis debitis aut rerum
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
      repellendus. Temporibus autem quibusdam et aut officiis debitis aut rerum
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
      repellendus. Temporibus autem quibusdam et aut officiis debitis aut rerum
      necessitatibus saepe eveniet ut et voluptates repudiandae sint et
      molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente
      delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut
      perferendis doloribus asperiores repellat.
    </Text>
  </View>
);
export default class DiscoverSheet extends React.Component {
  renderInner = () => (
    <View style={{ backgroundColor: 'white', paddingTop: 12 }}>
      <View style={styles.header}>
        <View style={styles.panelHeader}>
          <View style={styles.panelHandle} />
        </View>
      </View>
      <Lorem />
    </View>
  );

  render() {
    return Platform.OS === 'ios' ? (
      <SlackBottomSheet
        initialAnimation={false}
        presentGlobally={false}
        backgroundOpacity={0}
        allowsDragToDismiss={false}
        allowsTapToDismiss={false}
        isHapticFeedbackEnabled={false}
        blocksBackgroundTouches={false}
        startFromShortForm
        interactsWithOuterScrollView
      >
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
      </SlackBottomSheet>
    ) : (
      <BottomSheet
        borderRadius={20}
        renderContent={this.renderInner}
        overdragResistanceFactor={0}
        snapPoints={[300, 744]}
        springConfig={discoverSheetSpring}
      />
    );
  }
}

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
