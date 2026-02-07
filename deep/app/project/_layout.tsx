import { Stack } from 'expo-router';

export default function ProjectLayout() {
    return (
        <Stack
            screenOptions={{
                headerBackTitle: 'Back',
            }}
        />
    );
}
