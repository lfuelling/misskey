<template>
<div class="mk-user-timeline">
	<mk-notes ref="timeline" :make-promise="makePromise" @inited="() => $emit('loaded')"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';

const fetchLimit = 10;

export default Vue.extend({
	i18n: i18n('mobile/views/components/user-timeline.vue'),

	props: ['user', 'withMedia'],

	data() {
		return {
			makePromise: cursor => this.$root.api('users/notes', {
				userId: this.user.id,
				limit: fetchLimit + 1,
				withFiles: this.withMedia,
				untilId: cursor ? cursor : undefined
			}).then(notes => {
				if (notes.length == fetchLimit + 1) {
					notes.pop();
					return {
						notes: notes,
						more: true
					};
				} else {
					return {
						notes: notes,
						more: false
					};
				}
			})
		};
	}
});
</script>
