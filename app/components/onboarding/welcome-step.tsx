import { useTranslation } from "react-i18next";
import {
  AlertTriangleIcon,
  ChartLineIcon,
  OrderIcon,
} from "@shopify/polaris-icons";
import {
  BlockStack,
  Box,
  Button,
  Card,
  Icon,
  InlineStack,
  Text,
} from "@shopify/polaris";

export function WelcomeStep({ onContinue }: { onContinue: () => void }) {
  const { t } = useTranslation();

  return (
    <Card>
      <BlockStack gap="500">
        <BlockStack gap="200">
          <Text as="h2" variant="headingLg">
            {t("onboarding.welcome.heading")}
          </Text>
          <Text as="p" tone="subdued">
            {t("onboarding.welcome.subtitle")}
          </Text>
        </BlockStack>

        <BlockStack gap="400">
          <ValueBullet
            icon={ChartLineIcon}
            title={t("onboarding.welcome.bullets.forecast.title")}
            description={t("onboarding.welcome.bullets.forecast.description")}
          />
          <ValueBullet
            icon={AlertTriangleIcon}
            title={t("onboarding.welcome.bullets.alert.title")}
            description={t("onboarding.welcome.bullets.alert.description")}
          />
          <ValueBullet
            icon={OrderIcon}
            title={t("onboarding.welcome.bullets.order.title")}
            description={t("onboarding.welcome.bullets.order.description")}
          />
        </BlockStack>

        <InlineStack align="end">
          <Button variant="primary" size="large" onClick={onContinue}>
            {t("onboarding.welcome.continue")}
          </Button>
        </InlineStack>
      </BlockStack>
    </Card>
  );
}

function ValueBullet({
  icon,
  title,
  description,
}: {
  icon: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
}) {
  return (
    <InlineStack gap="400" blockAlign="start" wrap={false}>
      <Box
        background="bg-surface-secondary"
        borderRadius="200"
        padding="200"
        minWidth="40px"
      >
        <Icon source={icon} tone="base" />
      </Box>
      <BlockStack gap="050">
        <Text as="p" fontWeight="semibold">
          {title}
        </Text>
        <Text as="p" tone="subdued" variant="bodySm">
          {description}
        </Text>
      </BlockStack>
    </InlineStack>
  );
}
