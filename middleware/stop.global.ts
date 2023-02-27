export default defineNuxtRouteMiddleware((to) => {
    const { status } = useSession();

    if (status.value === "authenticated") {
        if (to.name === "interactive") {
            return navigateTo("/");
        }
    }
});
