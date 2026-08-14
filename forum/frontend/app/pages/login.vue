<script lang="ts" setup>
import {toast} from 'vue3-toastify';
import {defaultToastOptions} from '~/constants';

useHead({
  title: 'Log in - BracketBros',
});

const router = useRouter();

// Reactive variables for form state, user inputs, and loading state
const form = ref(false);
const identifier = ref('');
const password = ref('');
const rememberMe = ref(false);
const showPassword = ref(false);
const isLoading = ref(false);

// Validation rules for form fields
const rules = {
  required: (value: string) => !!value || 'Field is required',
};

// Asynchronous function to handle user login
const login = async () => {
  isLoading.value = true;

  // Constructing login data
  const loginData: loginData = {
    Identifier: identifier.value,
    Password: password.value,
    RememberMe: rememberMe.value,
  };

  // Sending the login request
  const response = await loginUser(loginData);

  // Handling the login response
  if (response.data || response.status === 204) {
    // Updating user activity state and redirecting
    await updateUserActivityState();
    await router.replace('/manage-account');
  } else if (response.status === 422 || response.status === 401) {
    // Handling invalid login credentials
    toast.error(
        'Invalid email/username or password.',
        defaultToastOptions.error
    );
  } else {
    // Handling other errors
    toast.error(
        'Unexpected error when trying to log in, please try again later.',
        defaultToastOptions.error
    );
  }

  // Resetting the loading state
  isLoading.value = false;
};

// Lifecycle hook to redirect if the user is already logged in
onMounted(async () => {
  const userActivity = useUserActivity();
  if (userActivity.value) {
    // Redirecting to the homepage if the user is already logged in
    await router.replace('/');
  }
});
</script>

<template>
  <nuxt-layout name="login-register">
    <v-form v-model="form" @submit.prevent="login">
      <v-text-field
          v-model="identifier"
          :rules="[rules.required]"
          class="mb-3"
          label="Email or username"
          variant="outlined"
      ></v-text-field>
      <v-text-field
          v-model="password"
          :rules="[rules.required]"
          :type="showPassword ? 'text' : 'password'"
          label="Password"
          variant="outlined"
      >
        <template v-slot:append-inner>
          <v-icon
              :icon="
              showPassword ? 'fa:fa-solid fa-eye-slash' : 'fa:fa-solid fa-eye'
            "
              size="x-small"
              @click="showPassword = !showPassword"
          ></v-icon>
        </template>
      </v-text-field>
      <v-checkbox
          v-model="rememberMe"
          class="mb-5"
          hide-details
          label="Remember me"
      ></v-checkbox>
      <v-btn
          :disabled="!form"
          :loading="isLoading"
          block
          class="text-body-1"
          size="x-large"
          type="submit"
          variant="tonal"
      >
        Log in
      </v-btn>
    </v-form>
    <nuxt-link class="d-block mt-8 text-body-2" to="/register">
      New here? Create an account.
    </nuxt-link>
  </nuxt-layout>
</template>
