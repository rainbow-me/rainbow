import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import BottomSheet from '../BottomSheet'
import Animated from 'react-native-reanimated'

const { block, set, greaterThan, lessThan, Value, cond, SpringUtils, sub } = Animated

const discoverSheetSpring = SpringUtils.makeConfigFromBouncinessAndSpeed({
  ...SpringUtils.makeDefaultConfig(),
  bounciness: 0,
  mass: 1,
  overshootClamping: false,
  restSpeedThreshold: 100,
  restDisplacementThreshold: 0.99,
  speed: 18,
  toss: 6,
});

const Lorem = () => (
  <View style={{ backgroundColor: 'white', paddingRight: 19, paddingLeft: 19 }}>
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
      perferendis doloribus asperiores repellat.

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
      perferendis doloribus asperiores repellat.

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
      perferendis doloribus asperiores repellat.

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
      perferendis doloribus asperiores repellat.

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
      perferendis doloribus asperiores repellat.

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
      perferendis doloribus asperiores repellat.

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
      perferendis doloribus asperiores repellat.

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
      perferendis doloribus asperiores repellat.

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
      perferendis doloribus asperiores repellat.

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
      perferendis doloribus asperiores repellat.

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
      perferendis doloribus asperiores repellat.

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
      perferendis doloribus asperiores repellat.

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
      perferendis doloribus asperiores repellat.

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
      perferendis doloribus asperiores repellat.
    </Text>
  </View>
)
export default class DiscoverSheet extends React.Component {
  renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.panelHeader}>
        <View style={styles.panelHandle} />
      </View>
    </View>
  )

  renderInner = () => (
    <View>
      <Lorem />
    </View>
  )

  render() {
    return (
      <BottomSheet
        renderContent={this.renderInner}
        renderHeader={this.renderHeader}
        overdragResistanceFactor={0}
        snapPoints={[300, 744]}
        springConfig={discoverSheetSpring}
      />
    )
  }
}

const IMAGE_SIZE = 200

const styles = StyleSheet.create({
  panelTitle: {
    fontSize: 27,
    fontWeight: "700",
    letterSpacing: -0.4,
    marginBottom: 10,
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 6,
    height: 40,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  panelHeader: {
    alignItems: 'center',
  },
  panelHandle: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#3C4252',
    opacity: 0.3,
    marginBottom: 10,
  },
})
