  const { data, error } = await supabase.auth.signUp({
    email: 'user@example.com',
    password: 'securepassword123',
    options: {
      data: {
        username: 'myusername'  // REQUIRED - gets stored in raw_user_meta_data
      }
    }
  })

  Key points:

  1. options.data.username is REQUIRED - this becomes raw_user_meta_data->>'username' in the database
  2. If username is not provided, the trigger will fail when trying to insert NULL into profiles.username (NOT NULL constraint)
  3. The options.data object can contain other metadata fields you want to store
  4. After successful signup, the trigger automatically creates a profile with the user's ID and username

  Example with additional metadata:
  await supabase.auth.signUp({
    email: 'alice@test.com',
    password: 'password123',
    options: {
      data: {
        username: 'alice_smith',    // Extracted by trigger
        avatar_url: 'https://...'   // Can be added to trigger if needed
      }
    }
  })