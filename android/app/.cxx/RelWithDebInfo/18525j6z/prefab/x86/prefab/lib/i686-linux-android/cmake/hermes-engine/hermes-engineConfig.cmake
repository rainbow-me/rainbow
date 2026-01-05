if(NOT TARGET hermes-engine::libhermes)
add_library(hermes-engine::libhermes SHARED IMPORTED)
set_target_properties(hermes-engine::libhermes PROPERTIES
    IMPORTED_LOCATION "/Users/ibrahim/.gradle/caches/8.14.3/transforms/01e8334d9e54f6826a911f8316b1c400/transformed/jetified-hermes-android-0.81.5-release/prefab/modules/libhermes/libs/android.x86/libhermes.so"
    INTERFACE_INCLUDE_DIRECTORIES "/Users/ibrahim/.gradle/caches/8.14.3/transforms/01e8334d9e54f6826a911f8316b1c400/transformed/jetified-hermes-android-0.81.5-release/prefab/modules/libhermes/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

