import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginVue from 'eslint-plugin-vue';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'],

  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      // Inherited from the original @sanidesk/ui, which shipped with no lint
      // gate. The extraction is a faithful lift, not a rewrite of component
      // internals, so these ride as warnings (clean them in a dedicated
      // follow-up diff). The boundary guard below is the one rule that MUST
      // stay an error.
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'vue/require-default-prop': 'warn',
      'vue/no-unused-vars': 'warn',
      'sort-imports': [
        'error',
        {
          ignoreCase: true,
          ignoreDeclarationSort: true,
          ignoreMemberSort: false,
        },
      ],

      // --- Sanibase boundary guard (the whole point of §13) ---------------
      // @sanibase is presentational-only. It must NEVER import a product's
      // domain / DB / auth / services / types package. If this rule ever
      // fires, the shared-design-system contract is being violated — fix
      // the import, do not relax the rule.
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@sanidesk/*', '@sanitax/*'],
              message:
                'Saniux is presentational-only: no product/domain imports. Inline what you need or take a prop.',
            },
          ],
        },
      ],
    },
  },

  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
    },
  },

  {
    ignores: ['**/dist/**', '**/node_modules/**', 'dev/**'],
  },
);
