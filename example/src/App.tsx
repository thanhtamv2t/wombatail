import { Pressable, Text, View } from 'react-native'
import { cn } from './cn'

type CardProps = {
  selected?: boolean
  disabled?: boolean
}

function Card({ selected = false, disabled = false }: CardProps) {
  return (
    <View
      className={cn(
        'mx-4 my-3 rounded-2xl border border-border bg-surface p-4',
        selected && 'border-primary',
        disabled && 'opacity-50',
        'md:p-6',
        'ios:mt-4',
      )}
    >
      <Text className="text-xl font-bold text-foreground">Wombatail MVP</Text>
      <Text className="mt-2 text-sm text-muted-foreground">
        Tailwind-like className syntax, compiled to Unistyles styles.
      </Text>

      <Pressable className="mt-4 self-start rounded-xl bg-primary px-4 py-3">
        <Text className="font-semibold text-on-primary">Continue</Text>
      </Pressable>
    </View>
  )
}

export default function App() {
  return (
    <View className="flex-1 bg-background pt-8">
      <Card selected />
      <View className="mx-4 mt-4 h-[48px] w-1/2 rounded-[13px] bg-primary" />
    </View>
  )
}
