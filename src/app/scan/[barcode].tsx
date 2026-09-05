import { useEffect, useMemo } from 'react';
import { Linking, View } from 'react-native';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Disclaimer } from '@/components/halal/Disclaimer';
import { FindingList } from '@/components/halal/FindingList';
import { VerdictHeader } from '@/components/halal/VerdictHeader';
import {
  AppText,
  Button,
  Card,
  Divider,
  ErrorState,
  ListRow,
  Screen,
  SectionHeader,
  Skeleton,
} from '@/components/ui';
import {
  OFF_ADD_PRODUCT_URL,
  OFF_EDIT_PRODUCT_URL,
  ProductNotFoundError,
  RateLimitedError,
  type ScannedProduct,
} from '@/api/openFoodFacts';
import { useScannedProduct } from '@/api/queries';
import { unknownProductExplanation } from '@/lib/halalCopy';
import { evaluateIngredients, type HalalVerdictResult } from '@/lib/halalVerdict';
import { track } from '@/lib/telemetry';
import { useScanHistory } from '@/store/halalScans';
import { useTheme } from '@/theme';
import { radius, spacing } from '@/theme/tokens';

function productTitle(product: ScannedProduct): string {
  return product.name ?? `Strekkode ${product.barcode}`;
}

export default function ScanResultScreen() {
  const { barcode } = useLocalSearchParams<{ barcode: string }>();
  const code = String(barcode ?? '');
  const navigation = useNavigation();
  const { data, isPending, isError, error, refetch } = useScannedProduct(code);
  const recordScan = useScanHistory((state) => state.recordScan);

  const result = useMemo<HalalVerdictResult | null>(() => {
    if (!data) return null;
    return evaluateIngredients({
      text: data.ingredientsText,
      language: data.ingredientsLanguage,
      tags: data.ingredientTags,
    });
  }, [data]);

  useEffect(() => {
    navigation.setOptions({ title: data ? productTitle(data) : 'Skanning' });
  }, [navigation, data]);

  useEffect(() => {
    if (!data || !result) return;
    recordScan({
      barcode: data.barcode,
      name: data.name,
      brand: data.brand,
      verdict: result.verdict,
      at: Date.now(),
    });
    track('halal_verdict_shown', { verdict: result.verdict, basis: result.basis });
  }, [data, result, recordScan]);

  useEffect(() => {
    if (!isError) return;
    if (error instanceof ProductNotFoundError) {
      recordScan({ barcode: code, name: null, brand: null, verdict: null, at: Date.now() });
      track('halal_product_missing');
    }
  }, [isError, error, code, recordScan]);

  if (isPending) return <LoadingView />;

  if (isError && error instanceof ProductNotFoundError) return <UnknownProductView barcode={code} />;

  if (isError || !data || !result) {
    const message =
      error instanceof RateLimitedError
        ? 'Vi spør produktdatabasen for ofte akkurat nå. Vent et minutt og prøv igjen.'
        : 'Vi fikk ikke kontakt med produktdatabasen. Sjekk nettet og prøv igjen.';
    return (
      <Screen scroll>
        <ErrorState message={message} onRetry={() => refetch()} />
      </Screen>
    );
  }

  return <ResultView product={data} result={result} />;
}

function LoadingView() {
  return (
    <Screen scroll>
      <View style={{ gap: spacing.lg, marginTop: spacing.lg }}>
        <Skeleton height={120} rounded="xl" />
        <Skeleton height={80} rounded="lg" />
        <Skeleton height={80} rounded="lg" />
      </View>
    </Screen>
  );
}

function UnknownProductView({ barcode }: { barcode: string }) {
  const theme = useTheme();
  const router = useRouter();

  return (
    <Screen scroll>
      <View style={{ gap: spacing.lg, marginTop: spacing.lg }}>
        <Card rounded="xl">
          <View style={{ alignItems: 'center', gap: spacing.md }}>
            <Ionicons name="help-buoy-outline" size={40} color={theme.colors.textMuted} />
            <AppText size="lg" weight="bold" heading align="center">
              Vi fant ikke dette produktet
            </AppText>
            <AppText size="sm" tone="textSecondary" align="center">
              {unknownProductExplanation()}
            </AppText>
            <AppText size="sm" tone="textMuted" tabular>
              {barcode}
            </AppText>
          </View>
        </Card>

        <Button
          label="Legg inn produktet hos Open Food Facts"
          fullWidth
          onPress={() => {
            track('halal_add_product_opened');
            Linking.openURL(`${OFF_ADD_PRODUCT_URL}${barcode}`).catch(() => {});
          }}
        />
        <Button label="Skann et nytt produkt" variant="secondary" fullWidth onPress={() => router.back()} />

        <Disclaimer />
      </View>
    </Screen>
  );
}

function ResultView({
  product,
  result,
}: {
  product: ScannedProduct;
  result: HalalVerdictResult;
}) {
  const theme = useTheme();

  return (
    <Screen scroll>
      <View style={{ gap: spacing.lg, marginTop: spacing.lg }}>
        <ProductSummary product={product} />

        <VerdictHeader result={result} />

        <Disclaimer compact />

        {result.findings.length > 0 ? (
          <View>
            <SectionHeader
              title="Hvorfor"
              subtitle="Hver linje viser hva vi fant i ingredienslisten"
            />
            <FindingList findings={result.findings} />
          </View>
        ) : null}

        {result.unrecognised.length > 0 ? (
          <Card rounded="lg">
            <View style={{ gap: spacing.sm }}>
              <AppText weight="semibold">Ingredienser vi ikke kjenner igjen</AppText>
              <AppText size="sm" tone="textSecondary">
                Vi går aldri god for en ingrediens vi ikke har slått opp.
              </AppText>
              <AppText size="sm" tone="textMuted">
                {result.unrecognised.map((tag) => tag.replace(/^[a-z]{2}:/, '')).join(', ')}
              </AppText>
            </View>
          </Card>
        ) : null}

        {product.ingredientsText.length > 0 ? (
          <Card rounded="lg">
            <View style={{ gap: spacing.sm }}>
              <AppText weight="semibold">Ingredienslisten</AppText>
              <AppText size="sm" tone="textSecondary">
                {product.ingredientsText}
              </AppText>
            </View>
          </Card>
        ) : null}

        <Card rounded="lg" padding="md">
          <ListRow
            title="Ingredienslisten er feil eller mangler"
            subtitle="Rett den hos Open Food Facts, som eier dataene"
            leading={
              <Ionicons name="create-outline" size={20} color={theme.colors.textSecondary} />
            }
            chevron
            onPress={() => {
              track('halal_report_opened');
              Linking.openURL(`${OFF_EDIT_PRODUCT_URL}${product.barcode}`).catch(() => {});
            }}
          />
          <Divider />
          <ListRow
            title="Om ingrediensdataene"
            subtitle="Åpen database fra Open Food Facts, lisens ODbL"
            leading={
              <Ionicons
                name="information-circle-outline"
                size={20}
                color={theme.colors.textSecondary}
              />
            }
            chevron
            onPress={() => {
              Linking.openURL(
                `https://world.openfoodfacts.org/product/${product.barcode}`,
              ).catch(() => {});
            }}
          />
        </Card>

        <Disclaimer />
      </View>
    </Screen>
  );
}

function ProductSummary({ product }: { product: ScannedProduct }) {
  const theme = useTheme();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
      {product.imageUrl ? (
        <Image
          source={{ uri: product.imageUrl }}
          style={{
            width: 64,
            height: 64,
            borderRadius: radius.md,
            backgroundColor: theme.colors.surfaceSunken,
          }}
          contentFit="contain"
        />
      ) : null}
      <View style={{ flex: 1, gap: spacing.xxs }}>
        <AppText size="lg" weight="bold" heading>
          {productTitle(product)}
        </AppText>
        <AppText size="sm" tone="textMuted">
          {[product.brand, product.quantity].filter(Boolean).join(' · ') || product.barcode}
        </AppText>
      </View>
    </View>
  );
}
