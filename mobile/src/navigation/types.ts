import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

export type HomeTabParamList = {
  HomeTab: undefined;
  ShopTab: undefined;
  CategoriesTab: undefined;
  CartTab: undefined;
  ProfileTab: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Register: undefined;
  VerifyEmail: { token?: string };
  ForgotPassword: undefined;
  MainTabs: NavigatorScreenParams<HomeTabParamList> | undefined;
  ProductDetail: { id: number };
  ProductList: { categoryId?: number; title?: string; search?: string } | undefined;
  Checkout: undefined;
  OrderDetail: { id: number };
  About: undefined;
  Contact: undefined;
  HowItWorks: undefined;
  EditProfile: undefined;
  MyOrders: undefined;
  Notifications: undefined;
  ChangePassword: undefined;
};

export type RootScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;

export type TabScreenProps<T extends keyof HomeTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<HomeTabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;

/** Props for a screen that appears both as a tab and a stack screen. */
export type TabOrStackScreenProps = CompositeScreenProps<
  BottomTabScreenProps<HomeTabParamList, 'ShopTab'>,
  NativeStackScreenProps<RootStackParamList, 'ProductList'>
>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}