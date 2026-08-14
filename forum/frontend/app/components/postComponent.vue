<script lang="ts" setup>
import {useTheme} from 'vuetify/lib/framework.mjs';
import {toast} from 'vue3-toastify';
import {defaultToastOptions} from '@/constants';

const router = useRouter();
const theme = useTheme();

const {current} = theme;

// Reactive references for dynamic surface and post highlight colors
const surfaceColor = ref('');
const postHighlightColor = ref('');

// Function to update the color values based on the theme
const updateColors = () => {
  surfaceColor.value = current.value.colors.surface;
  postHighlightColor.value = current.value.dark
      ? current.value.colors['on-surface-variant']
      : current.value.colors['on-surface'];
};

// Watcher to update colors when the theme changes
watch(() => current.value, updateColors);

// Defining emit events for the component
const emit = defineEmits(['commentAdded']);

// Define component props with defaults
const props = withDefaults(
    defineProps<{
      post: post;
      expandContent?: boolean;
      preventHighlighting?: boolean;
    }>(),
    {expandContent: false, preventHighlighting: false}
);

// Custom hook to track user activities
const userActivity = useUserActivity();

// Reactive variables to track post status related to the user
const madeByUser = ref(false);
const isAdmin = ref(false);
const likedByUser = ref(false);
const savedByUser = ref(false);

// Watch for changes in userActivity and update post status accordingly
watchEffect(() => {
  if (userActivity.value?.username) {
    madeByUser.value = userActivity.value.posts.includes(props.post.id);
    isAdmin.value = userActivity.value.role === 'Admin';
    likedByUser.value = userActivity.value.likedPosts.includes(props.post.id);
    savedByUser.value = userActivity.value.savedPosts.includes(props.post.id);
  }
});

// References for content container and content for overflow checks
const contentContainer_ref = ref<HTMLElement | null>(null);
const content_ref = ref<HTMLElement | null>(null);

// Reactive variables to handle content overflow
const contentContainer_isOverflowing = ref(false);
const contentContainer_showOverflow = ref(false);

// Variables for post highlighting logic
const highlightPost = ref(false);
const stop_highlightPost = ref(false);

// Function to check for content overflow
const checkOverflow = () => {
  nextTick(() => {
    if (
        !contentContainer_showOverflow.value &&
        contentContainer_ref.value &&
        content_ref.value
    ) {
      contentContainer_isOverflowing.value =
          contentContainer_ref.value.offsetHeight <
          content_ref.value.offsetHeight;
    }
  });
};

// Constructing a link to the post
const postLink = `/post/${props.post.id}`;

// Function to navigate to the post
const goToPost = async () => {
  await router.push({path: postLink});
};

// Function to handle liking a post
const handleLikeClick = async () => {
  await likePost(props.post.id);
};

// Emit event when a comment is added to the post
const handleCommentAdded = () => {
  emit('commentAdded');
};

// Function to save a post
const handleSaveClick = () => {
  savePost(props.post.id);
};

// Function to share the post link
const handleShareClick = () => {
  const fullUrl = window.location.origin + postLink;
  navigator.clipboard
      .writeText(fullUrl)
      .then(() => {
        toast.success(
            'Link to post copied to clipboard.',
            defaultToastOptions.success
        );
      })
      .catch((error) => {
        console.error('Failed to copy text to clipboard', error);
      });
};

// Function to navigate to post editing
const handleEditClick = () => {
  router.push(`/edit-post/${props.post.id}`);
};

// Reactive variable for delete post dialog
const showDeletePostDialog = ref(false);

// Function to handle post deletion
const handleDeletePost = () => {
  showDeletePostDialog.value = false;
  deletePost(props.post.id);
};

// Function to handle post click, avoiding navigation if clicking on a link
const handlePostClick = async (event: MouseEvent) => {
  for (let element of event.composedPath()) {
    if ((element as HTMLElement).tagName === 'A') {
      return;
    }
  }
  await goToPost();
};

// Lifecycle hook for initial setup
onMounted(() => {
  updateColors();
  if (!props.expandContent) {
    checkOverflow();
    window.addEventListener('resize', checkOverflow);
  }
});

// Lifecycle hook for cleanup
onUnmounted(() => {
  window.removeEventListener('resize', checkOverflow);
});
</script>

<template>
  <v-card
      :class="{
      highlight: !preventHighlighting && highlightPost && !stop_highlightPost,
    }"
      class="post d-flex flex-row w-100 rounded-lg elevation-4"
  >
    <div class="d-flex flex-column h-100 pa-3">
      <v-btn
          v-ripple="{ class: `text-red` }"
          class="rounded-lg"
          icon
          size="small"
          variant="plain"
          @click="handleLikeClick"
      >
        <v-icon
            :color="likedByUser ? 'red' : ''"
            :icon="
            likedByUser ? 'fa:fa-solid fa-heart' : 'fa:fa-regular fa-heart'
          "
        ></v-icon>
        <v-tooltip activator="parent" location="start" open-delay="500">
          Like post
        </v-tooltip>
      </v-btn>
      <div class="mx-auto mb-1 text-caption text-medium-emphasis">
        {{ formatNumber(post.totalLikes + (likedByUser ? 1 : 0)) }}
      </div>

      <v-btn
          v-ripple="{ class: `text-green` }"
          class="rounded-lg"
          icon
          size="small"
          variant="plain"
      >
        <v-icon icon="fa:fa-regular fa-comment"></v-icon>
        <v-tooltip activator="parent" location="start" open-delay="500">
          Comment on this post
        </v-tooltip>
        <create-comment-dialog
            :post-id="post.id"
            :title="post.title"
            type="post"
            @comment-added="handleCommentAdded"
        ></create-comment-dialog>
      </v-btn>
      <div class="mx-auto mb-1 text-caption text-medium-emphasis">
        {{ formatNumber(post.totalComments) }}
      </div>

      <v-divider class="w-75 mx-auto my-3"></v-divider>

      <v-btn
          v-ripple="{ class: `text-blue` }"
          class="rounded-lg"
          icon
          size="small"
          variant="plain"
          @click="handleSaveClick"
      >
        <v-icon
            :color="savedByUser ? 'blue' : ''"
            :icon="
            savedByUser
              ? 'fa:fa-solid fa-bookmark'
              : 'fa:fa-regular fa-bookmark'
          "
        ></v-icon>
        <v-tooltip activator="parent" location="start" open-delay="500">
          Save post
        </v-tooltip>
      </v-btn>

      <v-btn
          v-ripple="{ class: `text-yellow` }"
          class="rounded-lg"
          icon
          size="small"
          variant="plain"
          @click="handleShareClick"
      >
        <v-icon icon="fa:fa-regular fa-share-from-square"></v-icon>
        <v-tooltip activator="parent" location="start" open-delay="500">
          Share post
        </v-tooltip>
      </v-btn>

      <v-divider
          v-if="madeByUser || isAdmin"
          class="w-75 mx-auto my-3"
      ></v-divider>

      <v-btn
          v-if="madeByUser"
          class="rounded-lg"
          color="warning"
          icon
          size="small"
          variant="plain"
          @click="handleEditClick"
      >
        <v-icon icon="fa:fa-solid fa-pen-to-square"></v-icon>
        <v-tooltip activator="parent" location="start" open-delay="500">
          Edit post
        </v-tooltip>
      </v-btn>

      <v-btn
          v-if="madeByUser || isAdmin"
          class="rounded-lg"
          color="error"
          icon
          size="small"
          variant="plain"
      >
        <v-icon icon="fa:fa-solid fa-trash-can"></v-icon>
        <v-tooltip
            activator="parent"
            class="text-center"
            location="start"
            open-delay="500"
        >
          Delete post
          <div v-if="madeByUser">(as creator)</div>
          <div v-else>(as admin)</div>
        </v-tooltip>
        <v-dialog
            v-model="showDeletePostDialog"
            activator="parent"
            width="auto"
        >
          <v-card class="px-10 py-6 rounded-lg">
            <v-card-item class="px-0">
              <v-card-title class="text-h5">
                Delete "{{ post.title }}"
              </v-card-title>
            </v-card-item>
            <v-card-text class="px-0">
              Are you sure you want to permanently delete this post?
            </v-card-text>
            <v-card-actions class="px-0">
              <v-btn
                  class="text-body-1"
                  variant="outlined"
                  @click="showDeletePostDialog = false"
              >
                No, cancel
              </v-btn>
              <v-btn
                  class="text-body-1"
                  color="error"
                  variant="outlined"
                  @click="handleDeletePost"
              >
                Yes, delete post
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-btn>
    </div>

    <v-divider class="my-5" vertical></v-divider>

    <v-card class="main-container w-100 pa-5 rounded-0 elevation-0">
      <div class="d-flex justify-space-between align-center mb-4">
        <div class="text-medium-emphasis">
          <v-chip :color="post.category.color" size="small" variant="flat">
            {{ post.category.name }}
          </v-chip>
          <v-chip
              v-for="tag in post.tags"
              :key="tag.tagId"
              class="ml-1"
              size="small"
          >
            {{ tag.name }}
          </v-chip>
        </div>
        <div class="d-flex align-center">
          <div
              class="user-and-creation-info text-right text-caption text-medium-emphasis"
          >
            <div class="font-weight-bold">
              {{ post.user.username }}
            </div>
            <div>
              {{ formatTimeAgo(post.dateCreated) }}
            </div>
          </div>
          <v-avatar class="ml-2" size="28px">
            <v-img
                v-if="
                madeByUser
                  ? userActivity?.profilePicture
                  : post.user.profilePicture
              "
                :src="
                madeByUser
                  ? userActivity?.profilePicture || ''
                  : post.user.profilePicture || ''
              "
            ></v-img>
            <v-icon v-else color="primary" icon="fa:fa-solid fa-user"></v-icon>
          </v-avatar>
        </div>
      </div>

      <div
          class="h-100"
          @click="!preventHighlighting && handlePostClick($event)"
          @mouseenter="highlightPost = true"
          @mouseleave="highlightPost = false"
      >
        <div class="text-h4 pb-4">
          {{ post.title }}
        </div>

        <v-hover>
          <template v-slot:default="{ isHovering, props }">
            <div
                ref="contentContainer_ref"
                :class="
                contentContainer_isOverflowing
                  ? contentContainer_showOverflow
                    ? 'show-overflow'
                    : 'hide-overflow'
                  : expandContent
                  ? 'show-overflow'
                  : ''
              "
                class="content-container"
                v-bind="props"
            >
              <div ref="content_ref" class="content">
                <markdown-renderer :content="post.content"></markdown-renderer>
              </div>
              <v-btn
                  v-if="
                  contentContainer_isOverflowing &&
                  !contentContainer_showOverflow
                "
                  :class="isHovering ? 'on-parent-hover' : ''"
                  class="show-btn"
                  size="small"
                  variant="tonal"
                  @click="
                  (contentContainer_showOverflow = true),
                    (stop_highlightPost = false),
                    $event.stopPropagation()
                "
                  @mouseenter="stop_highlightPost = true"
                  @mouseleave="stop_highlightPost = false"
              >
                Show more
                <template v-slot:append>
                  <v-icon
                      icon="fa:fa-solid fa-chevron-down"
                      size="small"
                  ></v-icon>
                </template>
              </v-btn>
            </div>
          </template>
        </v-hover>
      </div>
    </v-card>
  </v-card>
</template>

<style lang="scss" scoped>
.post {
  outline: 1px solid transparent;
  transition: outline-color 200ms ease;

  &.highlight {
    outline-color: v-bind(postHighlightColor);
  }
}

.user-and-creation-info {
  line-height: normal;
}

.content-container {
  max-height: 250px;
  overflow-y: hidden;
  position: relative;
  transition: max-height 2500ms linear;

  &.show-overflow {
    max-height: 5000px;
  }

  &.hide-overflow {
    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      height: 100%;
      width: 100%;
      background: linear-gradient(transparent 50%, v-bind(surfaceColor) 100%);
      z-index: 0;
    }

    .show-btn {
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translate(-50%, 105%);
      z-index: 1;

      &.on-parent-hover {
        transform: translate(-50%, 0);
      }
    }
  }
}
</style>
