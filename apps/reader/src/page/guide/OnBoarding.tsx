import { AccountModalPhase, userAccountModalAtom } from "@/atom/modalAtoms"
import { DelayedSlider } from "@/component/Sliders"
import { useTranslation } from "@pmate/i18n"
import { profileAtom } from "@pmate/account-sdk"
import { Button } from "@pmate/uikit"
import LogoSVG from "@pmate/uikit/src/assets/logo2.svg"
import { useAtom, useAtomValue } from "jotai"
import { useNavigate } from "react-router"
import classes from "./OnBoarding.module.scss"

export const OnBoarding = () => {
  const nav = useNavigate()
  const user = useAtomValue(profileAtom)
  const [, showLogin] = useAtom(userAccountModalAtom)
  const isLoggedIn = !!user
  const t = useTranslation()
  return (
    <div className={classes.OnBoarding}>
      <div>
        <div className="border border-[#edf5f5] rounded-[2rem] shadow p-4 m-4 mb-12">
          <h3
            style={{
              fontWeight: 600,
            }}
          >
            <img src={LogoSVG} />
            {t("PChip Reader")}
          </h3>

          {!isLoggedIn && (
            <>
              <p>{t("Read with experts to help you understand,")}</p>
              <p>
                {t("Comprehensive training in English listening and reading.")}
              </p>
            </>
          )}
          {isLoggedIn && (
            <p>
              {t("Hi, {{nickName}}! Welcome!", {
                nickName: user?.nickName || "",
              })}
            </p>
          )}
        </div>

        {!isLoggedIn && (
          <DelayedSlider delay={500} direction="up">
            <div className="border border-[#edf5f5] rounded-[2rem] shadow p-4 m-4 mb-12">
              <p>
                {t(
                  "We detected this is your first time using PChip Reader. Add some books!"
                )}
              </p>
              <p>
                <Button
                  onClick={() => {
                    if (!isLoggedIn) {
                      showLogin({
                        open: true,
                        phase: AccountModalPhase.Login,
                      })
                      return
                    }
                  }}
                >
                  {t("Browse library")}
                </Button>
                <Button
                  onClick={async () => {
                    if (!isLoggedIn) {
                      showLogin({
                        open: true,
                        phase: AccountModalPhase.Login,
                      })
                      return
                    }
                  }}
                >
                  {t("Add your own TXT/PDF")}
                </Button>
              </p>
            </div>
          </DelayedSlider>
        )}

        {!isLoggedIn && (
          <DelayedSlider delay={2000} direction="up">
            <div>
              <p>
                {t("Already have an account?")}
                <Button
                  variant="plain"
                  onClick={async () => {
                    if (!isLoggedIn) {
                      showLogin({
                        open: true,
                        phase: AccountModalPhase.Login,
                      })
                      return
                    }
                    nav("/home", {
                      replace: true,
                    })
                  }}
                >
                  {t("Click here to login")}
                </Button>
              </p>
            </div>
          </DelayedSlider>
        )}
      </div>
    </div>
  )
}
