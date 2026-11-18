import { Plus, ShoppingCart, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useToast } from '@/components/toast';
import { Button, Dialog, DialogHeader, Input } from '@/components/ui';
import { api } from '@/lib/api';
import { getApiErrorMessage } from '@indenance/core';
import { fonts, radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

interface DraftItem {
  key: string;
  name: string;
  quantity: string;
  price: string;
}

let keyCounter = 0;

export function NewShoppingListModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const theme = useTheme();
  const toast = useToast();
  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');
  const [items, setItems] = useState<DraftItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const close = () => {
    setName('');
    setBudget('');
    setItems([]);
    setError(null);
    onClose();
  };

  const updateItem = (key: string, patch: Partial<DraftItem>) => {
    setItems((prev) =>
      prev.map((item) => (item.key === key ? { ...item, ...patch } : item)),
    );
  };

  const onSubmit = async () => {
    if (!name.trim()) {
      setError('El nombre de la lista es obligatorio.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const { data: list } = await api.post<{ id: string }>('/shopping-lists', {
        name: name.trim(),
      });
      for (const item of items) {
        if (!item.name.trim()) continue;
        await api.post(`/shopping-lists/${list.id}/items`, {
          name: item.name.trim(),
          quantity: Math.max(1, Number(item.quantity) || 1),
          price: Math.max(0, Number(item.price) || 0),
        });
      }
      toast.success('Lista de compra creada');
      close();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Error al crear la lista'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={close}>
      <DialogHeader
        icon={ShoppingCart}
        iconColor="#ea580c"
        iconBg="rgba(249,115,22,0.16)"
        title="Nueva lista de compra"
        description="Crea una lista para organizar tus compras"
        onClose={close}
      />

      <View style={styles.form}>
        <Input
          label="Nombre de la lista"
          placeholder="Ej. Compra semanal"
          value={name}
          onChangeText={setName}
          error={error ?? undefined}
        />

        <Input
          label="Presupuesto estimado"
          prefix="$"
          keyboardType="numeric"
          placeholder="0"
          value={budget}
          onChangeText={setBudget}
        />

        <View style={styles.itemsHeader}>
          <Text style={[styles.itemsLabel, { color: theme.text }]}>Artículos</Text>
          <Pressable
            hitSlop={8}
            onPress={() =>
              setItems((prev) => [
                ...prev,
                { key: `item-${keyCounter++}`, name: '', quantity: '1', price: '' },
              ])
            }
            style={styles.addButton}
            accessibilityRole="button"
          >
            <Plus size={14} color={theme.primary[600]} />
            <Text style={[styles.addText, { color: theme.primary[600] }]}>
              Agregar
            </Text>
          </Pressable>
        </View>

        {items.length === 0 ? (
          <View
            style={[
              styles.emptyItems,
              { borderColor: theme.border, backgroundColor: theme.surfaceRaised },
            ]}
          >
            <Text style={[styles.emptyItemsText, { color: theme.textMuted }]}>
              Agrega artículos a tu lista
            </Text>
          </View>
        ) : (
          <View style={styles.items}>
            {items.map((item) => (
              <View key={item.key} style={[styles.itemRow, { borderColor: theme.border }]}>
                <Input
                  containerStyle={styles.itemName}
                  placeholder="Artículo"
                  value={item.name}
                  onChangeText={(value) => updateItem(item.key, { name: value })}
                />
                <Input
                  containerStyle={styles.itemQty}
                  placeholder="1"
                  keyboardType="numeric"
                  value={item.quantity}
                  onChangeText={(value) => updateItem(item.key, { quantity: value })}
                />
                <Input
                  containerStyle={styles.itemPrice}
                  placeholder="$0"
                  keyboardType="numeric"
                  value={item.price}
                  onChangeText={(value) => updateItem(item.key, { price: value })}
                />
                <Pressable
                  hitSlop={8}
                  onPress={() =>
                    setItems((prev) => prev.filter((entry) => entry.key !== item.key))
                  }
                  style={styles.removeButton}
                  accessibilityLabel="Quitar artículo"
                >
                  <X size={16} color={theme.textMuted} />
                </Pressable>
              </View>
            ))}
          </View>
        )}

        <Button size="lg" loading={isSubmitting} onPress={onSubmit}>
          Crear lista
        </Button>
      </View>
    </Dialog>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.lg,
  },
  itemsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  itemsLabel: {
    fontSize: 14,
    fontFamily: fonts.medium,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addText: {
    fontSize: 12,
    fontFamily: fonts.medium,
  },
  emptyItems: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyItemsText: {
    fontSize: 14,
    fontFamily: fonts.regular,
  },
  items: {
    gap: spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    padding: spacing.sm,
  },
  itemName: {
    flex: 1,
  },
  itemQty: {
    width: 56,
  },
  itemPrice: {
    width: 84,
  },
  removeButton: {
    paddingHorizontal: 4,
  },
});
