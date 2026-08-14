<script lang="ts" setup>
import {toast} from 'vue3-toastify';
import {defaultToastOptions} from '@/constants';
import fileFetch from '~/utils/fileFetch';

useHead({
  title: 'Manage your account - BracketBros',
});

const router = useRouter();

// Reactive variables for password change form state and inputs
const passwordForm = ref(false);
const passwordFormRef = ref();
const oldPassword = ref('');
const newPassword = ref('');
const showOldPassword = ref(false);
const showNewPassword = ref(false);
const changePassword_isLoading = ref(false);

// Reactive variables for profile picture management
const profilePicture = ref<File[]>([]);
const changeProfilePicture_isLoading = ref(false);
const removeProfilePicture_isLoading = ref(false);

// Validation rules for form fields
const rules = {
  required: (value: string) => !!value || 'Field is required',
  noPasswordMatch: () =>
      oldPassword.value !== newPassword.value || `Passwords cannot be the same`,
};

// Asynchronous function to handle password change
const changePassword = async () => {
  changePassword_isLoading.value = true;

  // Sending the change password request
  const response = await changeUserPassword(
      oldPassword.value,
      newPassword.value
  );

  // Handling the response for password change
  if (response.data) {
    toast.success('Password has been changed.', defaultToastOptions.success);
  } else if (response.status === 422) {
    toast.error(
        'You are not authorized to change the password of this user.',
        defaultToastOptions.error
    );
  } else {
    toast.error(
        'An unexpected error occurred when trying to change password, please try again later.',
        defaultToastOptions.error
    );
  }

  // Resetting form state
  passwordFormRef.value.reset();
  showOldPassword.value = false;
  showNewPassword.value = false;
  changePassword_isLoading.value = false;
};

// Computed property for profile picture preview
const previewProfilePicture = computed(() => {
  return profilePicture.value.length > 0
      ? URL.createObjectURL(profilePicture.value[0])
      : '';
});

const files = ref(); // Reactive reference for file inputs

// Function to handle file change
//https://stackoverflow.com/questions/65703814/how-to-upload-file-in-vue-js-version-3

function handleFileChange() {
  files.value = profilePicture.value;
}

// Asynchronous function to upload a new profile picture
// Source https://stackoverflow.com/questions/65703814/how-to-upload-file-in-vue-js-version-3

const uploadProfilePicture = async () => {
  changeProfilePicture_isLoading.value = true;

  const file = files.value[0];

  const body = new FormData();
  body.append('profilePicture', file);

  // Sending the profile picture upload request
  const response = await fileFetch({
    method: 'POST',
    url: 'http://localhost:5112/api/Account/uploadProfilePicture',
    body: body,
  });

  // Handling the response for profile picture upload
  if (response.status === 200) {
    await updateUserActivityState();
    toast.success(
        `Profile picture has been updated`,
        defaultToastOptions.success
    );
  } else if (response.status === 422) {
    toast.error(
        'You are not authorized to update the profile picture of this user.',
        defaultToastOptions.error
    );
  } else {
    toast.error(
        'An unexpected error occurred, please try again later.',
        defaultToastOptions.error
    );
  }

  changeProfilePicture_isLoading.value = false;
};

// Asynchronous function to remove the profile picture
const removeProfilePicture = async () => {
  removeProfilePicture_isLoading.value = true;

  // Sending the profile picture removal request
  const response = await deleteProfilePicture();

  // Handling the response for profile picture removal
  if (response?.status === 200) {
    await updateUserActivityState();
    toast.success(
        `Profile picture has been removed`,
        defaultToastOptions.success
    );
  } else if (response?.status === 422) {
    toast.error(
        'You are not authorized to remove the profile picture of this user.',
        defaultToastOptions.error
    );
  } else {
    toast.error(
        'An unexpected error occurred, please try again later.',
        defaultToastOptions.error
    );
  }

  removeProfilePicture_isLoading.value = false;
};

// Asynchronous function for user logout
const logout = async () => {
  await logoutUser();
  await router.replace('/login');
};

// Lifecycle hook to check login status and reroute
onMounted(() => {
  checkLoginAndReroute();
});
</script>

<template>
  <nuxt-layout name="login-register">
    <v-form
        ref="passwordFormRef"
        v-model="passwordForm"
        @submit.prevent="changePassword"
    >
      <h1 class="d-flex align-center mb-5 text-body-1">
        <v-icon class="mr-2" icon="fa:fa-solid fa-lock" size="x-small"></v-icon>
        Password
      </h1>

      <v-text-field
          v-model="oldPassword"
          :rules="[rules.required]"
          :type="showOldPassword ? 'text' : 'password'"
          class="mb-1"
          density="compact"
          label="Current password"
          variant="outlined"
      >
        <template v-slot:append-inner>
          <v-icon
              :icon="
              showOldPassword
                ? 'fa:fa-solid fa-eye-slash'
                : 'fa:fa-solid fa-eye'
            "
              size="x-small"
              @click="showOldPassword = !showOldPassword"
          ></v-icon>
        </template>
      </v-text-field>

      <v-text-field
          v-model="newPassword"
          :rules="[rules.required, rules.noPasswordMatch()]"
          :type="showNewPassword ? 'text' : 'password'"
          density="compact"
          label="New password"
          variant="outlined"
      >
        <template v-slot:append-inner>
          <v-icon
              :icon="
              showNewPassword
                ? 'fa:fa-solid fa-eye-slash'
                : 'fa:fa-solid fa-eye'
            "
              size="x-small"
              @click="showNewPassword = !showNewPassword"
          ></v-icon>
        </template>
      </v-text-field>

      <v-btn
          :disabled="!passwordForm"
          :loading="changePassword_isLoading"
          block
          class="text-body-1"
          size="large"
          type="submit"
          variant="tonal"
      >
        Change password
      </v-btn>
    </v-form>

    <v-divider class="my-8"></v-divider>

    <h1 class="d-flex align-center mb-5 text-body-1">
      <v-icon class="mr-2" icon="fa:fa-solid fa-image" size="x-small"></v-icon>
      Profile Picture
    </h1>

    <v-file-input
        v-model="profilePicture"
        accept="image/png, image/jpeg"
        density="compact"
        label="Select profile picture"
        prepend-icon=""
        variant="outlined"
        @change="handleFileChange"
    >
    </v-file-input>

    <v-img
        v-if="previewProfilePicture"
        :src="previewProfilePicture"
        class="mt-4 mb-6"
        contain
        height="auto"
        width="100%"
    ></v-img>

    <v-btn
        :disabled="profilePicture.length === 0"
        :loading="changeProfilePicture_isLoading"
        block
        class="text-body-1 mb-6"
        size="large"
        type="submit"
        variant="tonal"
        @click="uploadProfilePicture()"
    >
      Change profile picture
    </v-btn>

    <v-btn
        :loading="removeProfilePicture_isLoading"
        block
        class="text-body-1"
        size="large"
        type="submit"
        variant="tonal"
        @click="removeProfilePicture()"
    >
      Remove profile picture
    </v-btn>

    <v-divider class="my-8"></v-divider>

    <v-btn
        block
        class="text-body-1"
        size="large"
        variant="tonal"
        @click="logout"
    >
      Logout
    </v-btn>
  </nuxt-layout>
</template>
